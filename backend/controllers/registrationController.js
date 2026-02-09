const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { generateTicketId, generateQR } = require('../utils/qrGenerator');
const { sendEmail } = require('../config/email');
const { eventRegistrationEmail } = require('../utils/emailTemplates');

exports.registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check eligibility
    const canRegister = event.canRegister();
    if (!canRegister.allowed) {
      return res.status(400).json({ success: false, message: canRegister.reason });
    }

    // Check if already registered
    const existing = await Registration.findOne({ event: eventId, participant: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }

    // Generate ticket
    const ticketId = generateTicketId();
    const qrData = {
      ticketId,
      eventId,
      participantId: req.user._id.toString(),
      eventName: event.name,
    };
    const qrCode = await generateQR(qrData);

    // Create registration
    const registration = await Registration.create({
      event: eventId,
      participant: req.user._id,
      formResponses: req.body.formResponses || {},
      ticketId,
      qrCode,
      amountPaid: event.registrationFee,
    });

    // Update event registration count
    event.currentRegistrations += 1;
    if (event.customForm) event.customForm.isLocked = true;
    await event.save();

    // Send email
    await sendEmail({
      to: req.user.email,
      subject: `Registration Confirmed - ${event.name}`,
      html: eventRegistrationEmail({
        participantName: `${req.user.firstName} ${req.user.lastName}`,
        eventName: event.name,
        eventDate: event.eventStartDate.toLocaleDateString(),
        ticketId,
        qrCode,
        eventType: event.eventType,
      }),
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration: await registration.populate('event', 'name eventStartDate organizer'),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ participant: req.user._id })
      .populate('event', 'name eventType eventStartDate organizer status')
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name' }
      })
      .sort({ registeredAt: -1 });

    res.json({ success: true, registrations });
  } catch (error) {
    next(error);
  }
};

exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.registrationId);

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    registration.status = 'cancelled';
    await registration.save();

    // Decrement event registration count
    const event = await Event.findById(registration.event);
    if (event) {
      event.currentRegistrations = Math.max(0, event.currentRegistrations - 1);
      await event.save();
    }

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (error) {
    next(error);
  }
};