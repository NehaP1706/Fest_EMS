const Registration = require('../models/Registration');
const Event = require('../models/Event');
const QRCode = require('qrcode');
const { generateTicketId } = require('../utils/qrGenerator');
const { sendEmail } = require('../config/email');
const { eventRegistrationEmail } = require('../utils/emailTemplates');

exports.registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check eligibility - CRITICAL: Block non-IIIT from IIIT-only events
    if (event.eligibility === 'IIIT Students Only') {
      if (!req.user.participantType || req.user.participantType.toLowerCase() !== 'iiit') {
        return res.status(403).json({ 
          success: false, 
          message: 'This event is only open to IIIT students. You cannot register.' 
        });
      }
    }

    // Check if organizer has manually closed registrations
    if (event.registrationsClosed) {
      return res.status(400).json({
        success: false,
        message: 'Registrations for this event are currently closed by the organizer.',
      });
    }

    // Check registration window
    const canRegister = event.canRegister();
    if (!canRegister.allowed) {
      return res.status(400).json({ success: false, message: canRegister.reason });
    }

    // Check if already registered — only block if an ACTIVE (non-cancelled) registration exists.
    // Cancelled registrations are hard-deleted, but guard against status edge cases anyway.
    const existing = await Registration.findOne({
      event: eventId,
      participant: req.user._id,
      status: { $ne: 'cancelled' },
    });
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

    // Generate QR as both a data URL (for storing in DB) and a Buffer (for email CID attachment)
    // Email clients like Gmail block data: URIs, so we embed the QR as a CID attachment instead
    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
    const qrCodeBuffer = await QRCode.toBuffer(qrString, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1,
    });
    const qrCode = qrCodeDataURL; // stored in DB as data URL

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

    // Send email with QR code embedded as a CID attachment
    // This is required because Gmail and most email clients block data: URI images
    await sendEmail({
      to: req.user.email,
      subject: `Registration Confirmed - ${event.name}`,
      html: eventRegistrationEmail({
        participantName: `${req.user.firstName} ${req.user.lastName}`,
        eventName: event.name,
        eventDate: event.eventStartDate.toLocaleDateString(),
        ticketId,
        qrCode: 'cid:qrcode',   // Reference the CID attachment in the HTML
        eventType: event.eventType,
      }),
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCodeBuffer,
          cid: 'qrcode',         // Content-ID referenced above as cid:qrcode
        },
      ],
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

    if (registration.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Registration already cancelled' });
    }

    // Hard-delete the registration document so the participant can re-register later.
    // The compound unique index { event, participant } would block re-registration if we
    // only soft-flagged status = 'cancelled' — deleting removes that constraint.
    // NOTE: Merchandise stock is intentionally NOT restored on cancellation
    // (physical items are reserved and cannot be re-stocked automatically).
    await registration.deleteOne();

    // Decrement the event's live registration count
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

exports.getEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    // Verify the event belongs to this organizer
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view registrations for this event',
      });
    }
    
    // Fetch all registrations for this event
    const registrations = await Registration.find({ event: eventId })
      .populate('participant', 'firstName lastName email contactNumber participantType')
      .sort({ registeredAt: -1 });
    
    res.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEventPurchases = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    // Verify the event belongs to this organizer
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view purchases for this event',
      });
    }
    
    // Fetch all merchandise purchases for this event
    const MerchandisePurchase = require('../models/MerchandisePurchase');
    const purchases = await MerchandisePurchase.find({ event: eventId })
      .populate('participant', 'firstName lastName email contactNumber participantType')
      .sort({ purchaseDate: -1 });
    
    res.json({
      success: true,
      count: purchases.length,
      purchases,
    });
  } catch (error) {
    next(error);
  }
};