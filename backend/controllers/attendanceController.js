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

    // Create the CSV data with headers explicitly defined
    const headers = ['Name', 'Email', 'Contact', 'Ticket ID', 'Timestamp', 'Method'];
    const rows = attendances.map(a => [
      `"${a.participant.firstName} ${a.participant.lastName}"`,
      `"${a.participant.email}"`,
      `"${a.participant.contactNumber || 'N/A'}"`,
      `"${a.ticketId}"`,
      `"${new Date(a.scannedAt).toLocaleString()}"`, // Added Timestamp
      `"${a.isManualEntry ? 'Manual' : 'QR Scan'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${eventId}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
exports.removeAttendance = async (req, res, next) => {
  try {
    const { eventId, participantId } = req.params;

    const attendance = await Attendance.findOneAndDelete({
      event: eventId,
      participant: participantId,
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    // Decrement event attendance count
    await Event.findByIdAndUpdate(eventId, { $inc: { totalAttendance: -1 } });

    // Revert attended flag on registration or purchase
    const Registration = require('../models/Registration');
    const MerchandisePurchase = require('../models/MerchandisePurchase');

    const reg = await Registration.findOne({ event: eventId, participant: participantId });
    if (reg) {
      reg.attended = false;
      reg.attendedAt = undefined;
      await reg.save();
    } else {
      const purchase = await MerchandisePurchase.findOne({ event: eventId, participant: participantId });
      if (purchase) {
        purchase.attended = false;
        purchase.attendedAt = undefined;
        await purchase.save();
      }
    }

    res.json({ success: true, message: 'Attendance removed successfully' });
  } catch (error) {
    next(error);
  }
};