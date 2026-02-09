const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique ticket ID
 * @returns {string} Unique ticket ID
 */
const generateTicketId = () => {
  const prefix = 'FEL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate QR code from ticket data
 * @param {Object} ticketData - Data to encode in QR code
 * @returns {Promise<string>} Base64 encoded QR code
 */
const generateQRCode = async (ticketData) => {
  try {
    const qrData = JSON.stringify(ticketData);
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
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
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Create complete ticket with QR code
 * @param {Object} params - Ticket parameters
 * @param {string} params.eventId - Event ID
 * @param {string} params.eventName - Event name
 * @param {string} params.participantId - Participant ID
 * @param {string} params.participantName - Participant name
 * @param {string} params.participantEmail - Participant email
 * @param {string} params.eventType - Type of event (normal/merchandise)
 * @param {Date} params.eventDate - Event date
 * @param {string} params.teamName - Team name (optional)
 * @returns {Promise<Object>} Ticket object with ticketId and qrCode
 */
const createTicket = async ({
  eventId,
  eventName,
  participantId,
  participantName,
  participantEmail,
  eventType,
  eventDate,
  teamName = null,
  variantDetails = null, // For merchandise
}) => {
  try {
    const ticketId = generateTicketId();
    
    const ticketData = {
      ticketId,
      eventId,
      eventName,
      participantId,
      participantName,
      participantEmail,
      eventType,
      eventDate: eventDate.toISOString(),
      teamName,
      variantDetails,
      issuedAt: new Date().toISOString(),
    };

    const qrCode = await generateQRCode(ticketData);

    return {
      ticketId,
      qrCode,
      ticketData,
    };
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw new Error('Failed to create ticket');
  }
};

/**
 * Verify ticket from QR code data
 * @param {string} qrData - JSON string from scanned QR code
 * @returns {Object} Parsed ticket data
 */
const verifyTicket = (qrData) => {
  try {
    const ticketData = JSON.parse(qrData);
    
    // Validate required fields
    const requiredFields = ['ticketId', 'eventId', 'participantId', 'issuedAt'];
    for (const field of requiredFields) {
      if (!ticketData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return {
      valid: true,
      data: ticketData,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

/**
 * Generate ticket HTML for email
 * @param {Object} ticketInfo - Ticket information
 * @returns {string} HTML string
 */
const generateTicketHTML = (ticketInfo) => {
  const {
    ticketId,
    qrCode,
    eventName,
    participantName,
    eventDate,
    eventType,
    teamName,
    variantDetails,
  } = ticketInfo;

  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .ticket-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .ticket-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .ticket-header h1 {
          margin: 0;
          font-size: 28px;
        }
        .ticket-body {
          padding: 30px;
        }
        .qr-section {
          text-align: center;
          margin: 20px 0;
        }
        .qr-section img {
          max-width: 250px;
          border: 2px solid #667eea;
          padding: 10px;
          border-radius: 8px;
        }
        .ticket-id {
          background: #f8f9fa;
          padding: 15px;
          border-left: 4px solid #667eea;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          font-size: 16px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .info-label {
          font-weight: bold;
          color: #666;
        }
        .info-value {
          color: #333;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .badge {
          display: inline-block;
          padding: 5px 12px;
          background: #667eea;
          color: white;
          border-radius: 20px;
          font-size: 12px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <div class="ticket-header">
          <h1>🎫 Felicity Event Ticket</h1>
          <div class="badge">${eventType.toUpperCase()}</div>
        </div>
        <div class="ticket-body">
          <div class="qr-section">
            <img src="${qrCode}" alt="QR Code" />
            <p style="color: #666; margin-top: 10px;">Scan this QR code at the event</p>
          </div>
          
          <div class="ticket-id">
            Ticket ID: ${ticketId}
          </div>

          <div class="info-row">
            <span class="info-label">Event:</span>
            <span class="info-value">${eventName}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Participant:</span>
            <span class="info-value">${participantName}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Date & Time:</span>
            <span class="info-value">${formattedDate}</span>
          </div>
          
          ${teamName ? `
          <div class="info-row">
            <span class="info-label">Team:</span>
            <span class="info-value">${teamName}</span>
          </div>
          ` : ''}
          
          ${variantDetails ? `
          <div class="info-row">
            <span class="info-label">Item Details:</span>
            <span class="info-value">${variantDetails}</span>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Please present this ticket at the event venue.</p>
          <p>For any queries, contact the event organizer.</p>
          <p style="margin-top: 15px; color: #999;">© 2026 Felicity - IIIT Hyderabad</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateTicketId,
  generateQRCode,
  createTicket,
  verifyTicket,
  generateTicketHTML,
};