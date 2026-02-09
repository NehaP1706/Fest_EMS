const QRCode = require('qrcode');

/**
 * Generate QR code from ticket data
 * @param {Object} ticketData - Data to encode in QR code
 * @returns {Promise<string>} Base64 encoded QR code image
 */
const generateQR = async (ticketData) => {
  try {
    const qrString = JSON.stringify(ticketData);
    
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate unique ticket ID
 * @returns {string} Unique ticket ID
 */
const generateTicketId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `TKT-${timestamp}-${randomStr}`.toUpperCase();
};

/**
 * Decode QR code data
 * @param {string} qrData - QR code data string
 * @returns {Object} Parsed ticket data
 */
const decodeQR = (qrData) => {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    throw new Error('Invalid QR code data');
  }
};

module.exports = {
  generateQR,
  generateTicketId,
  decodeQR,
};