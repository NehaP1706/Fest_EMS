const MerchandisePurchase = require('../models/MerchandisePurchase');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { generateTicketId, generateQR } = require('../utils/qrGenerator');
const { sendEmail } = require('../config/email');
const { merchandiseApprovalEmail, merchandiseRejectionEmail, merchandiseClaimedEmail } = require('../utils/emailTemplates');

// @desc    Purchase merchandise (upload payment proof)
// @route   POST /api/merchandise/:eventId/purchase
// @access  Private (Participant)
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

// @desc    Claim merchandise after registration (Participant)
// @route   POST /api/merchandise/:registrationId/claim
// @access  Private (Participant)
exports.claimMerchandise = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const { itemId, variant, quantity } = req.body;

    // Find registration and verify ownership
    const registration = await Registration.findById(registrationId)
      .populate('event');

    if (!registration) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registration not found' 
      });
    }

    if (registration.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to claim this merchandise' 
      });
    }

    // Verify event is merchandise type
    if (registration.event.eventType !== 'merchandise') {
      return res.status(400).json({ 
        success: false, 
        message: 'This event is not a merchandise event' 
      });
    }

    // Check if already claimed
    const existingPurchase = await MerchandisePurchase.findOne({
      event: registration.event._id,
      participant: req.user._id,
      claimType: 'participant',
    });

    if (existingPurchase) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already claimed merchandise for this event' 
      });
    }

    // Find the merchandise item
    const merchandiseItem = registration.event.merchandiseItems.find(
      item => item.itemId === itemId
    );

    if (!merchandiseItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Merchandise item not found' 
      });
    }

    // Find the variant
    const selectedVariant = merchandiseItem.variants.find(v => v.variantId === variant);
    
    if (!selectedVariant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Variant not found' 
      });
    }

    // Check stock
    if (selectedVariant.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Only ${selectedVariant.stock} items available.` 
      });
    }

    // Check purchase limit
    if (quantity > merchandiseItem.purchaseLimit) {
      return res.status(400).json({ 
        success: false, 
        message: `Purchase limit is ${merchandiseItem.purchaseLimit} per participant` 
      });
    }

    // Generate ticket ID and QR code
    const ticketId = generateTicketId();
    const qrData = {
      ticketId,
      registrationId: registration._id.toString(),
      eventId: registration.event._id.toString(),
      participantId: req.user._id.toString(),
      merchandiseItemId: itemId,
      variant: selectedVariant.variantId,
      quantity,
    };
    const qrCode = await generateQR(qrData);

    // Create merchandise purchase record
    const purchase = await MerchandisePurchase.create({
      event: registration.event._id,
      participant: req.user._id,
      registration: registrationId,
      merchandiseItem: {
        itemId: merchandiseItem.itemId,
        itemName: merchandiseItem.itemName,
      },
      variant: {
        variantId: selectedVariant.variantId,
        name: selectedVariant.name,
        size: selectedVariant.size,
        color: selectedVariant.color,
        price: selectedVariant.price,
      },
      quantity,
      totalAmount: selectedVariant.price * quantity,
      paymentStatus: 'approved', // Auto-approved for claim
      ticketId,
      qrCode,
      claimType: 'participant',
      claimedAt: new Date(),
    });

    // Decrement stock
    const itemIndex = registration.event.merchandiseItems.findIndex(
      item => item.itemId === itemId
    );
    const variantIndex = registration.event.merchandiseItems[itemIndex].variants.findIndex(
      v => v.variantId === variant
    );
    
    registration.event.merchandiseItems[itemIndex].variants[variantIndex].stock -= quantity;
    registration.event.currentRegistrations += 1;
    registration.event.totalRevenue += purchase.totalAmount;
    await registration.event.save();

    // Populate for email
    await purchase.populate('participant', 'firstName lastName email');

    // Send confirmation email
    await sendEmail({
      to: purchase.participant.email,
      subject: `Merchandise Claimed - ${registration.event.name}`,
      html: merchandiseClaimedEmail({
        participantName: `${purchase.participant.firstName} ${purchase.participant.lastName}`,
        eventName: registration.event.name,
        itemName: merchandiseItem.itemName,
        variant: selectedVariant.name,
        quantity,
        ticketId,
        qrCode,
      }),
    });

    res.status(201).json({
      success: true,
      message: 'Merchandise claimed successfully! Check your email for the ticket.',
      purchase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue merchandise to participant (Organizer)
// @route   POST /api/merchandise/:eventId/issue
// @access  Private (Organizer)
exports.issueMerchandise = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { participantId, itemId, variant, quantity } = req.body;

    // Find event and verify ownership
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to issue merchandise for this event' 
      });
    }

    if (event.eventType !== 'merchandise') {
      return res.status(400).json({ 
        success: false, 
        message: 'This event is not a merchandise event' 
      });
    }

    // Verify participant has a registration
    const registration = await Registration.findOne({
      event: eventId,
      participant: participantId,
      status: 'confirmed',
    }).populate('participant', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({ 
        success: false, 
        message: 'Participant registration not found or not confirmed' 
      });
    }

    // Check if already issued
    const existingPurchase = await MerchandisePurchase.findOne({
      event: eventId,
      participant: participantId,
    });

    if (existingPurchase) {
      return res.status(400).json({ 
        success: false, 
        message: 'Merchandise already issued to this participant' 
      });
    }

    // Find the merchandise item
    const merchandiseItem = event.merchandiseItems.find(
      item => item.itemId === itemId
    );

    if (!merchandiseItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Merchandise item not found' 
      });
    }

    // Find the variant
    const selectedVariant = merchandiseItem.variants.find(v => v.variantId === variant);
    
    if (!selectedVariant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Variant not found' 
      });
    }

    // Check stock
    if (selectedVariant.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock. Only ${selectedVariant.stock} items available.` 
      });
    }

    // Generate ticket ID and QR code
    const ticketId = generateTicketId();
    const qrData = {
      ticketId,
      registrationId: registration._id.toString(),
      eventId: event._id.toString(),
      participantId: participantId,
      merchandiseItemId: itemId,
      variant: selectedVariant.variantId,
      quantity,
      issuedBy: 'organizer',
    };
    const qrCode = await generateQR(qrData);

    // Create merchandise purchase record
    const purchase = await MerchandisePurchase.create({
      event: eventId,
      participant: participantId,
      registration: registration._id,
      merchandiseItem: {
        itemId: merchandiseItem.itemId,
        itemName: merchandiseItem.itemName,
      },
      variant: {
        variantId: selectedVariant.variantId,
        name: selectedVariant.name,
        size: selectedVariant.size,
        color: selectedVariant.color,
        price: selectedVariant.price,
      },
      quantity,
      totalAmount: selectedVariant.price * quantity,
      paymentStatus: 'approved',
      ticketId,
      qrCode,
      claimType: 'organizer',
      issuedBy: req.organizer._id,
      issuedAt: new Date(),
    });

    // Decrement stock
    const itemIndex = event.merchandiseItems.findIndex(
      item => item.itemId === itemId
    );
    const variantIndex = event.merchandiseItems[itemIndex].variants.findIndex(
      v => v.variantId === variant
    );
    
    event.merchandiseItems[itemIndex].variants[variantIndex].stock -= quantity;
    event.currentRegistrations += 1;
    event.totalRevenue += purchase.totalAmount;
    await event.save();

    // Send confirmation email
    await sendEmail({
      to: registration.participant.email,
      subject: `Merchandise Issued - ${event.name}`,
      html: merchandiseClaimedEmail({
        participantName: `${registration.participant.firstName} ${registration.participant.lastName}`,
        eventName: event.name,
        itemName: merchandiseItem.itemName,
        variant: selectedVariant.name,
        quantity,
        ticketId,
        qrCode,
        issuedByOrganizer: true,
      }),
    });

    res.status(201).json({
      success: true,
      message: 'Merchandise issued successfully!',
      purchase,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my purchases
// @route   GET /api/merchandise/my-purchases
// @access  Private (Participant)
exports.getMyPurchases = async (req, res, next) => {
  try {
    const purchases = await MerchandisePurchase.find({ participant: req.user._id })
      .populate('event', 'name merchandiseItems')
      .sort({ purchasedAt: -1 });

    res.json({ success: true, purchases });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending approvals (for payment proof uploads)
// @route   GET /api/merchandise/pending-approvals
// @access  Private (Organizer)
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

// @desc    Get event purchases (for organizer to see who has claimed/been issued merch)
// @route   GET /api/merchandise/event/:eventId
// @access  Private (Organizer)
exports.getEventPurchases = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const purchases = await MerchandisePurchase.find({ event: eventId })
      .populate('participant', 'firstName lastName email contactNumber participantType')
      .sort({ createdAt: -1 });

    res.json({ success: true, purchases });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve purchase (for payment proof uploads)
// @route   POST /api/merchandise/:purchaseId/approve
// @access  Private (Organizer)
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

// @desc    Reject purchase (for payment proof uploads)
// @route   POST /api/merchandise/:purchaseId/reject
// @access  Private (Organizer)
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