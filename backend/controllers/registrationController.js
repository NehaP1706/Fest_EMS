const Registration = require('../models/Registration');
const Event = require('../models/Event');
const QRCode = require('qrcode');
const { generateTicketId } = require('../utils/qrGenerator');
const { sendEmail } = require('../config/email');
const { eventRegistrationEmail } = require('../utils/emailTemplates');

const generateTicketAndQR = async (registration, event, user) => {
  const ticketId = generateTicketId();
  const qrData = {
    ticketId,
    eventId: event._id.toString(),
    participantId: user._id.toString(),
    eventName: event.name,
  };
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
  registration.ticketId = ticketId;
  registration.qrCode = qrCodeDataURL;
  registration.paymentStatus = 'approved';
  await registration.save();
  return { ticketId, qrCodeBuffer, qrCodeDataURL };
};

exports.registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.eligibility === 'iiit-only') {
      if (!req.user.participantType || req.user.participantType.toLowerCase() !== 'iiit') {
        return res.status(403).json({
          success: false,
          message: 'This event is only open to IIIT students.',
        });
      }
    }

    if (event.registrationsClosed) {
      return res.status(400).json({
        success: false,
        message: 'Registrations for this event are currently closed by the organizer.',
      });
    }

    const canRegister = event.canRegister();
    if (!canRegister.allowed) {
      return res.status(400).json({ success: false, message: canRegister.reason });
    }

    const existing = await Registration.findOne({
      event: eventId,
      participant: req.user._id,
      status: { $ne: 'cancelled' },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }

    const isPaid = event.registrationFee > 0;

    const registration = await Registration.create({
      event: eventId,
      participant: req.user._id,
      formResponses: req.body.formResponses || {},
      amountPaid: event.registrationFee,
      paymentStatus: isPaid ? 'pending_payment' : 'approved',
    });

    if (isPaid) {
      event.currentRegistrations += 1;
      if (event.customForm) event.customForm.isLocked = true;
      await event.save();

      return res.status(201).json({
        success: true,
        message: 'Form submitted! Please pay the registration fee and upload your payment proof.',
        registration: await registration.populate('event', 'name eventStartDate registrationFee'),
      });
    }

    const { ticketId, qrCodeBuffer } = await generateTicketAndQR(registration, event, req.user);

    event.currentRegistrations += 1;
    if (event.customForm) event.customForm.isLocked = true;
    await event.save();

    try {
      await sendEmail({
        to: req.user.email,
        subject: `Registration Confirmed - ${event.name}`,
        html: eventRegistrationEmail({
          participantName: `${req.user.firstName} ${req.user.lastName}`,
          eventName: event.name,
          eventDate: event.eventStartDate.toLocaleDateString(),
          ticketId,
          qrCode: 'cid:qrcode',
          eventType: event.eventType,
        }),
        attachments: [{ filename: 'qrcode.png', content: qrCodeBuffer, cid: 'qrcode' }],
      });
    } catch (emailErr) {
      console.error('Ticket email failed (non-fatal):', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration: await registration.populate('event', 'name eventStartDate organizer'),
    });
  } catch (error) {
    next(error);
  }
};

exports.submitPaymentProof = async (req, res, next) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (registration.paymentStatus !== 'pending_payment') {
      return res.status(400).json({
        success: false,
        message: registration.paymentStatus === 'pending_approval'
          ? 'Payment proof already submitted and is awaiting review.'
          : 'Registration is not awaiting payment.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof file is required.',
      });
    }

    registration.paymentProof = {
      filename: req.file.filename,
      path: req.file.path.replace(/\\/g, '/').split('/uploads/')[1] || req.file.path.replace(/\\/g, '/'),
      uploadedAt: new Date(),
    };
    registration.paymentStatus = 'pending_approval';
    await registration.save();

    res.json({
      success: true,
      message: 'Payment proof submitted! Awaiting organizer approval.',
      registration,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingApprovals = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const pending = await Registration.find({
      event: eventId,
      paymentStatus: 'pending_approval',
    })
      .populate('participant', 'firstName lastName email contactNumber participantType')
      .sort({ registeredAt: -1 });

    res.json({ success: true, count: pending.length, registrations: pending });
  } catch (error) {
    next(error);
  }
};

exports.approveRegistration = async (req, res, next) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .populate('event')
      .populate('participant', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const event = registration.event;
    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (registration.paymentStatus !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Registration is not pending approval' });
    }

    const { ticketId, qrCodeBuffer } = await generateTicketAndQR(
      registration,
      event,
      registration.participant
    );
    registration.reviewedBy = req.organizer._id;
    registration.reviewedAt = new Date();
    await registration.save();

    try {
      await sendEmail({
        to: registration.participant.email,
        subject: `Payment Approved - ${event.name}`,
        html: eventRegistrationEmail({
          participantName: `${registration.participant.firstName} ${registration.participant.lastName}`,
          eventName: event.name,
          eventDate: event.eventStartDate.toLocaleDateString(),
          ticketId,
          qrCode: 'cid:qrcode',
          eventType: event.eventType,
        }),
        attachments: [{ filename: 'qrcode.png', content: qrCodeBuffer, cid: 'qrcode' }],
      });
    } catch (emailErr) {
      console.error('Approval email failed (non-fatal):', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Registration approved and ticket sent to participant.',
      registration,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectRegistration = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason (minimum 5 characters)',
      });
    }

    const registration = await Registration.findById(registrationId)
      .populate('event', 'name organizer')
      .populate('participant', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (registration.paymentStatus !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Registration is not pending approval' });
    }

    registration.paymentStatus = 'rejected';
    registration.rejectionReason = reason.trim();
    registration.reviewedBy = req.organizer._id;
    registration.reviewedAt = new Date();
    await registration.save();

    try {
      await sendEmail({
        to: registration.participant.email,
        subject: `Payment Rejected - ${registration.event.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Payment Rejected</h2>
            <p>Dear ${registration.participant.firstName},</p>
            <p>Your registration payment for <strong>${registration.event.name}</strong> has been rejected.</p>
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason:</strong></p>
              <p style="margin: 8px 0 0 0;">${reason}</p>
            </div>
            <p>Please upload a valid payment proof or contact the organizer for clarification.</p>
            <p>Best regards,<br>Event Management Team</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Rejection email failed (non-fatal):', emailErr.message);
    }

    res.json({ success: true, message: 'Registration rejected.', registration });
  } catch (error) {
    next(error);
  }
};

exports.getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ participant: req.user._id })
      .populate('event', 'name eventType eventStartDate organizer status registrationFee')
      .populate({ path: 'event', populate: { path: 'organizer', select: 'name' } })
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

    await registration.deleteOne();

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

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const registrations = await Registration.find({ event: eventId })
      .populate('participant', 'firstName lastName email contactNumber participantType')
      .sort({ registeredAt: -1 });

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    next(error);
  }
};