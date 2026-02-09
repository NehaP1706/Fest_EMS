const MerchandisePurchase = require('../models/MerchandisePurchase');
const Event = require('../models/Event');
const { generateTicketId, generateQR } = require('../utils/qrGenerator');
const { sendEmail } = require('../config/email');
const { merchandiseApprovalEmail, merchandiseRejectionEmail } = require('../utils/emailTemplates');

exports.purchaseMerchandise = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const { variant, quantity } = req.body;
    const event = await Event.findById(eventId);

    if (!event || event.eventType !== 'merchandise') {
      return res.status(400).json({ success: false, message: 'Invalid merchandise event' });
    }

    // Check stock
    const selectedVariant = event.merchandiseDetails.variants.find(v => v.name === variant);
    if (!selectedVariant || selectedVariant.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const purchase = await MerchandisePurchase.create({
      event: eventId,
      participant: req.user._id,
      variant: selectedVariant,
      quantity,
      totalAmount: selectedVariant.price * quantity,
      paymentProof: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        uploadedAt: new Date(),
      } : null,
    });

    res.status(201).json({
      success: true,
      message: 'Purchase created. Awaiting payment approval.',
      purchase,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyPurchases = async (req, res, next) => {
  try {
    const purchases = await MerchandisePurchase.find({ participant: req.user._id })
      .populate('event', 'name merchandiseDetails')
      .sort({ purchasedAt: -1 });

    res.json({ success: true, purchases });
  } catch (error) {
    next(error);
  }
};

exports.getPendingApprovals = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.organizer._id, eventType: 'merchandise' });
    const eventIds = events.map(e => e._id);

    const purchases = await MerchandisePurchase.find({
      event: { $in: eventIds },
      paymentStatus: 'pending',
    })
      .populate('participant', 'firstName lastName email')
      .populate('event', 'name')
      .sort({ purchasedAt: -1 });

    res.json({ success: true, purchases });
  } catch (error) {
    next(error);
  }
};

exports.approvePurchase = async (req, res, next) => {
  try {
    const purchase = await MerchandisePurchase.findById(req.params.purchaseId)
      .populate('event')
      .populate('participant', 'firstName lastName email');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    // Generate ticket
    const ticketId = generateTicketId();
    const qrData = {
      ticketId,
      purchaseId: purchase._id.toString(),
      eventId: purchase.event._id.toString(),
      participantId: purchase.participant._id.toString(),
    };
    const qrCode = await generateQR(qrData);

    purchase.paymentStatus = 'approved';
    purchase.ticketId = ticketId;
    purchase.qrCode = qrCode;
    purchase.reviewedBy = req.organizer._id;
    purchase.reviewedAt = new Date();
    await purchase.save();

    // Decrement stock
    const event = purchase.event;
    const variantIndex = event.merchandiseDetails.variants.findIndex(v => v.name === purchase.variant.name);
    if (variantIndex !== -1) {
      event.merchandiseDetails.variants[variantIndex].stock -= purchase.quantity;
      event.currentRegistrations += 1;
      event.totalRevenue += purchase.totalAmount;
      await event.save();
    }

    // Send email
    await sendEmail({
      to: purchase.participant.email,
      subject: `Payment Approved - ${event.name}`,
      html: merchandiseApprovalEmail({
        participantName: `${purchase.participant.firstName} ${purchase.participant.lastName}`,
        eventName: event.name,
        itemName: event.merchandiseDetails.itemName,
        variant: purchase.variant.name,
        ticketId,
        qrCode,
      }),
    });

    res.json({ success: true, message: 'Purchase approved', purchase });
  } catch (error) {
    next(error);
  }
};

exports.rejectPurchase = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const purchase = await MerchandisePurchase.findById(req.params.purchaseId)
      .populate('event')
      .populate('participant', 'firstName lastName email');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    purchase.paymentStatus = 'rejected';
    purchase.rejectionReason = reason;
    purchase.reviewedBy = req.organizer._id;
    purchase.reviewedAt = new Date();
    await purchase.save();

    // Send email
    await sendEmail({
      to: purchase.participant.email,
      subject: `Payment Rejected - ${purchase.event.name}`,
      html: merchandiseRejectionEmail({
        participantName: `${purchase.participant.firstName} ${purchase.participant.lastName}`,
        itemName: purchase.event.merchandiseDetails.itemName,
        reason,
      }),
    });

    res.json({ success: true, message: 'Purchase rejected' });
  } catch (error) {
    next(error);
  }
};