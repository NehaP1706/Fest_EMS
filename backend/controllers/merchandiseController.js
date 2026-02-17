const MerchandisePurchase = require('../models/MerchandisePurchase');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const QRCode = require('qrcode');
const { generateTicketId } = require('../utils/qrGenerator');
const { sendEmail } = require('../config/email');
const { merchandiseTicketEmail } = require('../utils/emailTemplates');

// PARTICIPANT: Purchase merchandise with payment proof upload
exports.purchaseMerchandise = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { variantId, quantity } = req.body;

    // Validate payment proof upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof is required. Please upload a receipt image (JPEG, PNG, or PDF).',
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // DEBUG: Log the event structure
    console.log('Event merchandiseItems:', event.merchandiseItems);
    console.log('Looking for variantId:', variantId);

    // Check if merchandiseItems exists
    if (!event.merchandiseItems || event.merchandiseItems.length === 0) {
      return res.status(404).json({ success: false, message: 'No merchandise items found for this event' });
    }

    // Find the merchandise item and variant in merchandiseItems array
    let merchItem = null;
    let variant = null;

    for (const item of event.merchandiseItems) {
      console.log('Checking item:', item.itemName, 'variants:', item.variants?.length);
      if (item.variants && item.variants.length > 0) {
        const foundVariant = item.variants.find(v => v._id.toString() === variantId);
        if (foundVariant) {
          merchItem = item;
          variant = foundVariant;
          console.log('Found variant:', variant.name);
          break;
        }
      }
    }

    if (!merchItem || !variant) {
      console.log('Variant not found. Available variants:');
      event.merchandiseItems.forEach(item => {
        console.log(`Item: ${item.itemName}`);
        item.variants?.forEach(v => console.log(`  - ${v.name} (ID: ${v._id})`));
      });
      return res.status(404).json({ success: false, message: 'Merchandise item or variant not found' });
    }

    // Check stock availability (don't decrement yet - wait for approval)
    if (variant.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${variant.stock} items available.`,
      });
    }

    // Calculate total amount
    const totalAmount = variant.price * quantity;

    // Create purchase with payment proof in PENDING status
    const purchase = await MerchandisePurchase.create({
      event: eventId,
      participant: req.user._id,
      merchandiseItem: {
        itemId: merchItem._id.toString(),
        itemName: merchItem.itemName,
      },
      variant: {
        variantId: variant._id.toString(),
        name: variant.name,
        size: variant.size,
        color: variant.color,
        price: variant.price,
      },
      quantity,
      totalAmount,
      paymentProof: {
        filename: req.file.filename,
        path: req.file.path.replace(/\\/g, '/').split('/uploads/')[1] || req.file.path.replace(/\\/g, '/'),
        uploadedAt: new Date(),
      },
      paymentStatus: 'pending',
      claimType: 'payment',
    });

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully. Your payment proof has been submitted and is awaiting organizer approval.',
      purchase: await purchase.populate([
        { path: 'event', select: 'name organizer' },
        { path: 'participant', select: 'firstName lastName email' },
      ]),
    });
  } catch (error) {
    console.error('Purchase error:', error);
    next(error);
  }
};

// PARTICIPANT: Claim merchandise (for registered participants)
exports.claimMerchandise = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const { variantId, quantity } = req.body;

    console.log('=== CLAIM MERCHANDISE DEBUG ===');
    console.log('Registration ID:', registrationId);
    console.log('Variant ID received:', variantId);
    console.log('Quantity:', quantity);

    const registration = await Registration.findById(registrationId).populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const event = registration.event;
    console.log('Event ID:', event._id);
    console.log('Event Type:', event.eventType);
    console.log('Has merchandiseItems?', !!event.merchandiseItems);
    console.log('merchandiseItems length:', event.merchandiseItems?.length);

    // Check if merchandiseItems exists
    if (!event.merchandiseItems || event.merchandiseItems.length === 0) {
      console.log('ERROR: No merchandiseItems found');
      return res.status(404).json({ success: false, message: 'No merchandise items found for this event' });
    }

    // Find the merchandise item and variant in merchandiseItems array
    let merchItem = null;
    let variant = null;

    console.log('Searching for variant...');
    for (const item of event.merchandiseItems) {
      console.log(`Checking item: ${item.itemName} (ID: ${item._id})`);
      console.log(`  Has variants? ${!!item.variants}, count: ${item.variants?.length}`);
      
      if (item.variants && item.variants.length > 0) {
        item.variants.forEach(v => {
          console.log(`  Variant: ${v.name}, ID: ${v._id}, Match: ${v._id.toString() === variantId}`);
        });
        
        const foundVariant = item.variants.find(v => v._id.toString() === variantId);
        if (foundVariant) {
          merchItem = item;
          variant = foundVariant;
          console.log('✓ FOUND MATCH!', variant.name);
          break;
        }
      }
    }

    if (!merchItem || !variant) {
      console.log('ERROR: Variant not found after search');
      console.log('All available variant IDs:');
      event.merchandiseItems.forEach(item => {
        item.variants?.forEach(v => console.log(`  - ${v._id.toString()}`));
      });
      return res.status(404).json({ 
        success: false, 
        message: 'Merchandise item or variant not found',
        debug: {
          searchedFor: variantId,
          availableVariants: event.merchandiseItems.map(item => ({
            itemName: item.itemName,
            variants: item.variants?.map(v => ({ id: v._id.toString(), name: v.name }))
          }))
        }
      });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    // Check if already claimed
    const existingClaim = await MerchandisePurchase.findOne({
      registration: registrationId,
      'variant.variantId': variantId,
      paymentStatus: { $ne: 'rejected' },
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: 'You have already claimed this merchandise',
      });
    }

    const totalAmount = variant.price * quantity;

    // Generate ticket immediately for claims
    const ticketId = generateTicketId();
    const qrData = {
      ticketId,
      eventId: event._id.toString(),
      participantId: req.user._id.toString(),
      type: 'merchandise',
      itemName: merchItem.itemName,
      variant: variant.name,
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1,
    });

    // Create purchase (auto-approved for claims)
    const purchase = await MerchandisePurchase.create({
      event: event._id,
      participant: req.user._id,
      registration: registrationId,
      merchandiseItem: {
        itemId: merchItem._id.toString(),
        itemName: merchItem.itemName,
      },
      variant: {
        variantId: variant._id.toString(),
        name: variant.name,
        size: variant.size,
        color: variant.color,
        price: variant.price,
      },
      quantity,
      totalAmount,
      paymentStatus: 'approved',
      claimType: 'participant',
      claimedAt: new Date(),
      ticketId,
      qrCode: qrCodeDataURL,
    });

    // Decrement stock
    variant.stock -= quantity;
    await event.save();

    // Send email with QR code
    await sendEmail({
      to: req.user.email,
      subject: `Merchandise Ticket - ${event.name}`,
      html: merchandiseTicketEmail({
        participantName: `${req.user.firstName} ${req.user.lastName}`,
        eventName: event.name,
        itemName: merchItem.itemName,
        variant: variant.name,
        quantity,
        ticketId,
        qrCode: 'cid:qrcode',
      }),
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCodeBuffer,
          cid: 'qrcode',
        },
      ],
    });

    console.log('✓ Claim successful!');
    res.status(201).json({
      success: true,
      message: 'Merchandise claimed successfully',
      purchase: await purchase.populate([
        { path: 'event', select: 'name' },
        { path: 'participant', select: 'firstName lastName email' },
      ]),
    });
  } catch (error) {
    console.error('Claim error:', error);
    next(error);
  }
};

// Continue with the rest of the functions (issueMerchandise, getMyPurchases, etc.)
// They remain the same as in the FIXED version...

exports.issueMerchandise = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { participantId, variantId, quantity } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Find the merchandise item and variant in merchandiseItems array
    let merchItem = null;
    let variant = null;

    for (const item of event.merchandiseItems) {
      const foundVariant = item.variants.find(v => v._id.toString() === variantId);
      if (foundVariant) {
        merchItem = item;
        variant = foundVariant;
        break;
      }
    }

    if (!merchItem || !variant) {
      return res.status(404).json({ success: false, message: 'Merchandise item or variant not found' });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const User = require('../models/User');
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    const totalAmount = variant.price * quantity;

    // Generate ticket
    const ticketId = generateTicketId();
    const qrData = {
      ticketId,
      eventId: event._id.toString(),
      participantId: participant._id.toString(),
      type: 'merchandise',
      itemName: merchItem.itemName,
      variant: variant.name,
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1,
    });

    // Create purchase (issued by organizer)
    const purchase = await MerchandisePurchase.create({
      event: event._id,
      participant: participantId,
      merchandiseItem: {
        itemId: merchItem._id.toString(),
        itemName: merchItem.itemName,
      },
      variant: {
        variantId: variant._id.toString(),
        name: variant.name,
        size: variant.size,
        color: variant.color,
        price: variant.price,
      },
      quantity,
      totalAmount,
      paymentStatus: 'approved',
      claimType: 'organizer',
      issuedBy: req.organizer._id,
      issuedAt: new Date(),
      ticketId,
      qrCode: qrCodeDataURL,
    });

    // Decrement stock
    variant.stock -= quantity;
    await event.save();

    // Send email
    await sendEmail({
      to: participant.email,
      subject: `Merchandise Issued - ${event.name}`,
      html: merchandiseTicketEmail({
        participantName: `${participant.firstName} ${participant.lastName}`,
        eventName: event.name,
        itemName: merchItem.itemName,
        variant: variant.name,
        quantity,
        ticketId,
        qrCode: 'cid:qrcode',
      }),
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCodeBuffer,
          cid: 'qrcode',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Merchandise issued successfully',
      purchase: await purchase.populate([
        { path: 'event', select: 'name' },
        { path: 'participant', select: 'firstName lastName email' },
      ]),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyPurchases = async (req, res, next) => {
  try {
    const purchases = await MerchandisePurchase.find({ participant: req.user._id })
      .populate('event', 'name eventStartDate organizer')
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name' },
      })
      .sort({ purchasedAt: -1 });

    res.json({ success: true, purchases });
  } catch (error) {
    next(error);
  }
};

exports.getPendingApprovals = async (req, res, next) => {
  try {
    const purchases = await MerchandisePurchase.find({
      paymentStatus: 'pending',
      claimType: 'payment',
    })
      .populate('event', 'name organizer')
      .populate('participant', 'firstName lastName email contactNumber')
      .sort({ purchasedAt: -1 });

    const myPurchases = purchases.filter(
      p => p.event && p.event.organizer.toString() === req.organizer._id.toString()
    );

    res.json({ success: true, purchases: myPurchases });
  } catch (error) {
    next(error);
  }
};

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
      .populate('participant', 'firstName lastName email contactNumber')
      .sort({ purchasedAt: -1 });

    res.json({ success: true, purchases });
  } catch (error) {
    next(error);
  }
};

exports.approvePurchase = async (req, res, next) => {
  try {
    const { purchaseId } = req.params;
    console.log('\n=== APPROVE PURCHASE DEBUG ===');
    console.log('1. purchaseId:', purchaseId);
    console.log('2. organizer:', req.organizer?._id);

    const purchase = await MerchandisePurchase.findById(purchaseId)
      .populate('event')
      .populate('participant', 'firstName lastName email');

    console.log('3. purchase found:', !!purchase);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    console.log('4. paymentStatus:', purchase.paymentStatus);
    console.log('5. event organizer:', purchase.event?.organizer?.toString());
    console.log('6. req organizer:', req.organizer?._id?.toString());

    const event = purchase.event;
    if (event.organizer.toString() !== req.organizer._id.toString()) {
      console.log('7. FAILED: Not authorized');
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (purchase.paymentStatus !== 'pending') {
      console.log('7. FAILED: Already processed');
      return res.status(400).json({
        success: false,
        message: 'Purchase has already been processed',
      });
    }

    console.log('7. Generating ticket...');
    const ticketId = generateTicketId();
    console.log('8. ticketId:', ticketId);

    const qrData = {
      ticketId,
      eventId: event._id.toString(),
      participantId: purchase.participant._id.toString(),
      type: 'merchandise',
      itemName: purchase.merchandiseItem.itemName,
      variant: purchase.variant.name,
    };

    console.log('9. Generating QR code...');
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
    console.log('10. QR dataURL generated:', !!qrCodeDataURL);

    const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1,
    });
    console.log('11. QR buffer generated:', !!qrCodeBuffer);

    console.log('12. Saving purchase...');
    purchase.paymentStatus = 'approved';
    purchase.reviewedBy = req.organizer._id;
    purchase.reviewedAt = new Date();
    purchase.ticketId = ticketId;
    purchase.qrCode = qrCodeDataURL;
    await purchase.save();
    console.log('13. Purchase saved OK');

    // Decrement stock - inline search across all merchandiseItems
    let stockDecremented = false;
    for (const item of (event.merchandiseItems || [])) {
      const sv = item.variants.find(
        v => v._id.toString() === purchase.variant.variantId || v.variantId === purchase.variant.variantId
      );
      if (sv) {
        sv.stock = Math.max(0, sv.stock - purchase.quantity);
        await event.save();
        console.log('14. Stock decremented OK, new stock:', sv.stock);
        stockDecremented = true;
        break;
      }
    }
    if (!stockDecremented) {
      console.log('14. WARNING: variant not found for stock decrement, variantId:', purchase.variant.variantId);
    }

    // Send email (non-blocking)
    console.log('15. Sending email to:', purchase.participant.email);
    try {
      await sendEmail({
        to: purchase.participant.email,
        subject: `Payment Approved - ${event.name} Merchandise`,
        html: merchandiseTicketEmail({
          participantName: `${purchase.participant.firstName} ${purchase.participant.lastName}`,
          eventName: event.name,
          itemName: purchase.merchandiseItem.itemName,
          variant: purchase.variant.name,
          quantity: purchase.quantity,
          ticketId,
          qrCode: 'cid:qrcode',
        }),
        attachments: [{ filename: 'qrcode.png', content: qrCodeBuffer, cid: 'qrcode' }],
      });
      console.log('16. Email sent OK');
    } catch (emailError) {
      console.error('16. Email FAILED (non-fatal):', emailError.message);
    }

    console.log('17. Sending success response');
    res.json({
      success: true,
      message: 'Payment approved and ticket generated successfully',
      purchase,
    });
  } catch (error) {
    console.error('=== APPROVE PURCHASE CRASHED ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

exports.rejectPurchase = async (req, res, next) => {
  try {
    const { purchaseId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection (minimum 5 characters)',
      });
    }

    const purchase = await MerchandisePurchase.findById(purchaseId)
      .populate('event', 'name organizer')
      .populate('participant', 'firstName lastName email');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (purchase.event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (purchase.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Purchase has already been processed',
      });
    }

    purchase.paymentStatus = 'rejected';
    purchase.reviewedBy = req.organizer._id;
    purchase.reviewedAt = new Date();
    purchase.rejectionReason = reason.trim();
    await purchase.save();

    await sendEmail({
      to: purchase.participant.email,
      subject: `Payment Rejected - ${purchase.event.name} Merchandise`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Payment Rejected</h2>
          <p>Dear ${purchase.participant.firstName},</p>
          <p>Your merchandise payment for <strong>${purchase.event.name}</strong> has been rejected by the organizer.</p>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Item:</strong> ${purchase.merchandiseItem.itemName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Variant:</strong> ${purchase.variant.name}</p>
            <p style="margin: 8px 0 0 0;"><strong>Quantity:</strong> ${purchase.quantity}</p>
            <p style="margin: 8px 0 0 0;"><strong>Amount:</strong> ₹${purchase.totalAmount}</p>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Rejection Reason:</strong></p>
            <p style="margin: 8px 0 0 0;">${reason}</p>
          </div>
          
          <p>Please review the rejection reason and contact the event organizers for clarification or submit a new payment proof with the correct information.</p>
          
          <p>Best regards,<br>Event Management Team</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: 'Payment rejected successfully',
      purchase,
    });
  } catch (error) {
    next(error);
  }
};