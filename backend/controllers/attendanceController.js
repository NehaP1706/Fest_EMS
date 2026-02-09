const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const MerchandisePurchase = require('../models/MerchandisePurchase');
const Event = require('../models/Event');
const { decodeQR } = require('../utils/qrGenerator');

exports.scanQRCode = async (req, res, next) => {
  try {
    const { qrData, eventId } = req.body;

    const decoded = decodeQR(qrData);

    // Find registration or purchase
    let registration = await Registration.findOne({ ticketId: decoded.ticketId });
    let purchase = await MerchandisePurchase.findOne({ ticketId: decoded.ticketId });

    if (!registration && !purchase) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket',
      });
    }

    const record = registration || purchase;
    const participantId = record.participant;

    // Check if already scanned
    const existingAttendance = await Attendance.findOne({
      event: eventId,
      participant: participantId,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already scanned',
        scannedAt: existingAttendance.scannedAt,
      });
    }

    // Mark attendance
    const attendance = await Attendance.create({
      event: eventId,
      participant: participantId,
      ticketId: decoded.ticketId,
      scannedBy: req.organizer._id,
      scannerDevice: req.headers['user-agent'],
    });

    // Update registration/purchase
    if (registration) {
      registration.attended = true;
      registration.attendedAt = new Date();
      await registration.save();
    } else if (purchase) {
      purchase.attended = true;
      purchase.attendedAt = new Date();
      await purchase.save();
    }

    // Update event attendance count
    await Event.findByIdAndUpdate(eventId, { $inc: { totalAttendance: 1 } });

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEventAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const attendances = await Attendance.find({ event: eventId })
      .populate('participant', 'firstName lastName email')
      .sort({ scannedAt: -1 });

    const event = await Event.findById(eventId);
    const totalRegistrations = event.currentRegistrations;

    res.json({
      success: true,
      attendances,
      stats: {
        totalRegistrations,
        totalAttended: attendances.length,
        percentage: ((attendances.length / totalRegistrations) * 100).toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.manualAttendance = async (req, res, next) => {
  try {
    const { eventId, participantId, reason } = req.body;

    const attendance = await Attendance.create({
      event: eventId,
      participant: participantId,
      ticketId: `MANUAL-${Date.now()}`,
      scannedBy: req.organizer._id,
      isManualEntry: true,
      manualEntryReason: reason,
    });

    await Event.findByIdAndUpdate(eventId, { $inc: { totalAttendance: 1 } });

    res.json({ success: true, attendance });
  } catch (error) {
    next(error);
  }
};

exports.exportAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const attendances = await Attendance.find({ event: eventId })
      .populate('participant', 'firstName lastName email contactNumber')
      .populate('event', 'name');

    const csvData = attendances.map(a => ({
      Name: `${a.participant.firstName} ${a.participant.lastName}`,
      Email: a.participant.email,
      Contact: a.participant.contactNumber || 'N/A',
      TicketID: a.ticketId,
      ScannedAt: a.scannedAt.toISOString(),
      ManualEntry: a.isManualEntry ? 'Yes' : 'No',
    }));

    res.json({ success: true, data: csvData });
  } catch (error) {
    next(error);
  }
};