/**
 * Email Templates for Felicity EMS
 */

// Base email template
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .ticket-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .qr-code { margin: 20px 0; }
    .qr-code img { max-width: 250px; height: auto; border: 3px solid #667eea; border-radius: 8px; }
    .ticket-id { font-size: 18px; font-weight: bold; color: #667eea; margin: 10px 0; font-family: 'Courier New', monospace; }
    .event-details { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
    .detail-label { font-weight: 600; color: #495057; }
    .detail-value { color: #6c757d; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: 600; }
    .button:hover { background: #5568d3; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #dee2e6; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
    .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  ${content}
</body>
</html>
`;

// Event Registration Ticket
exports.eventRegistrationEmail = (data) => {
  const { participantName, eventName, eventDate, ticketId, qrCode, eventType } = data;
  
  const content = `
    <div class="container">
      <div class="header">
        <h1>🎉 Registration Confirmed!</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${participantName}</strong>,</p>
        <p>Congratulations! Your registration for <strong>${eventName}</strong> has been confirmed.</p>
        
        <div class="ticket-box">
          <h2 style="margin-top: 0; color: #667eea;">Your Ticket</h2>
          <div class="ticket-id">Ticket ID: ${ticketId}</div>
          <div class="qr-code">
            <img src="${qrCode}" alt="QR Code" />
          </div>
          <p style="color: #6c757d; font-size: 14px;">Present this QR code at the event venue</p>
        </div>
        
        <div class="event-details">
          <h3 style="margin-top: 0;">Event Details</h3>
          <div class="detail-row">
            <span class="detail-label">Event Name:</span>
            <span class="detail-value">${eventName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Event Type:</span>
            <span class="detail-value">${eventType}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Event Date:</span>
            <span class="detail-value">${eventDate}</span>
          </div>
          <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Ticket ID:</span>
            <span class="detail-value">${ticketId}</span>
          </div>
        </div>
        
        <div class="warning">
          <strong>⚠️ Important:</strong> Save this email or take a screenshot of your QR code. You'll need it for entry.
        </div>
        
        <p>We look forward to seeing you at the event!</p>
      </div>
      <div class="footer">
        <p><strong>Felicity Event Management System</strong></p>
        <p>IIIT Hyderabad</p>
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
};

// Merchandise Purchase Confirmation (After Approval)
exports.merchandiseApprovalEmail = (data) => {
  const { participantName, eventName, itemName, variant, ticketId, qrCode } = data;
  
  const content = `
    <div class="container">
      <div class="header">
        <h1>✅ Payment Approved!</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${participantName}</strong>,</p>
        
        <div class="success">
          <strong>Good news!</strong> Your payment for <strong>${itemName}</strong> has been approved.
        </div>
        
        <div class="ticket-box">
          <h2 style="margin-top: 0; color: #667eea;">Your Purchase Ticket</h2>
          <div class="ticket-id">Ticket ID: ${ticketId}</div>
          <div class="qr-code">
            <img src="${qrCode}" alt="QR Code" />
          </div>
          <p style="color: #6c757d; font-size: 14px;">Present this QR code to collect your merchandise</p>
        </div>
        
        <div class="event-details">
          <h3 style="margin-top: 0;">Purchase Details</h3>
          <div class="detail-row">
            <span class="detail-label">Item:</span>
            <span class="detail-value">${itemName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Variant:</span>
            <span class="detail-value">${variant}</span>
          </div>
          <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Ticket ID:</span>
            <span class="detail-value">${ticketId}</span>
          </div>
        </div>
        
        <p>Visit the collection counter with this QR code to receive your merchandise.</p>
      </div>
      <div class="footer">
        <p><strong>Felicity Event Management System</strong></p>
        <p>IIIT Hyderabad</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
};

// Merchandise Payment Rejection
exports.merchandiseRejectionEmail = (data) => {
  const { participantName, itemName, reason } = data;
  
  const content = `
    <div class="container">
      <div class="header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        <h1>❌ Payment Rejected</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${participantName}</strong>,</p>
        <p>Unfortunately, your payment proof for <strong>${itemName}</strong> could not be verified.</p>
        
        <div class="warning">
          <strong>Reason:</strong> ${reason || 'Payment proof was unclear or incorrect'}
        </div>
        
        <p>Please upload a clear payment proof and try again, or contact the organizers for assistance.</p>
        
        <a href="${process.env.FRONTEND_URL}/my-events" class="button">View My Orders</a>
      </div>
      <div class="footer">
        <p><strong>Felicity Event Management System</strong></p>
        <p>IIIT Hyderabad</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
};

// Organizer Credentials Email
exports.organizerCredentialsEmail = (data) => {
  const { organizerName, email, password, category } = data;
  
  const content = `
    <div class="container">
      <div class="header">
        <h1>🔑 Welcome to Felicity EMS</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${organizerName}</strong>,</p>
        <p>Your organizer account has been created for <strong>${category}</strong>.</p>
        
        <div class="event-details">
          <h3 style="margin-top: 0;">Login Credentials</h3>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${email}</span>
          </div>
          <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Password:</span>
            <span class="detail-value"><code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px;">${password}</code></span>
          </div>
        </div>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong> Please change your password after first login for security purposes.
        </div>
        
        <a href="${process.env.FRONTEND_URL}/login" class="button">Login Now</a>
      </div>
      <div class="footer">
        <p><strong>Felicity Event Management System</strong></p>
        <p>IIIT Hyderabad</p>
        <p>Keep your credentials safe and confidential.</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
};

// Password Reset Approval Email
exports.passwordResetEmail = (data) => {
  const { organizerName, newPassword } = data;
  
  const content = `
    <div class="container">
      <div class="header">
        <h1>🔐 Password Reset</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${organizerName}</strong>,</p>
        <p>Your password reset request has been approved by the administrator.</p>
        
        <div class="event-details">
          <h3 style="margin-top: 0;">New Password</h3>
          <div style="text-align: center; margin: 20px 0;">
            <code style="background: #f8f9fa; padding: 12px 20px; border-radius: 4px; font-size: 18px; display: inline-block;">${newPassword}</code>
          </div>
        </div>
        
        <div class="warning">
          <strong>⚠️ Action Required:</strong> Please login with this new password and change it immediately from your profile settings.
        </div>
        
        <a href="${process.env.FRONTEND_URL}/login" class="button">Login Now</a>
      </div>
      <div class="footer">
        <p><strong>Felicity Event Management System</strong></p>
        <p>IIIT Hyderabad</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
};

// New Discussion Notification
exports.newDiscussionEmail = (data) => {
  const { participantName, eventName, messagePreview, eventId } = data;
  
  const content = `
    <div class="container">
      <div class="header">
        <h1>💬 New Discussion Message</h1>
      </div>
      <div class="content">
        <p>Hi <strong>${participantName}</strong>,</p>
        <p>There's a new message in the discussion forum for <strong>${eventName}</strong>:</p>
        
        <div class="event-details">
          <p style="font-style: italic; color: #6c757d;">"${messagePreview}"</p>
        </div>
        
        <a href="${process.env.FRONTEND_URL}/events/${eventId}" class="button">View Discussion</a>
      </div>
      <div class="footer">
        <p><strong>Felicity Event Management System</strong></p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
};

exports.merchandiseClaimedEmail = ({
  participantName,
  eventName,
  itemName,
  variant,
  quantity,
  ticketId,
  qrCode,
  issuedByOrganizer = false,
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
          color: white;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e5e7eb;
        }
        .details-box {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .ticket-box {
          background: #ede9fe;
          border: 2px dashed #8b5cf6;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .ticket-id {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          font-weight: bold;
          color: #7c3aed;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Merchandise Claimed!</h1>
      </div>
      
      <div class="content">
        <p>Dear <strong>${participantName}</strong>,</p>
        
        <p>Your merchandise claim has been confirmed for <strong>${eventName}</strong>.</p>
        
        <div class="details-box">
          <h3>📦 Order Details</h3>
          <p><strong>Item:</strong> ${itemName}</p>
          <p><strong>Variant:</strong> ${variant}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
        </div>
        
        ${issuedByOrganizer ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p><strong>ℹ️ Note:</strong> This merchandise was issued to you by the event organizer.</p>
          </div>
        ` : ''}
        
        <div class="ticket-box">
          <p>Your Merchandise Ticket</p>
          <div class="ticket-id">${ticketId}</div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <p><strong>Present this QR Code:</strong></p>
          <img src="${qrCode}" alt="QR Code" style="max-width: 250px; border: 4px solid white; border-radius: 8px;" />
        </div>
        
        <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px;">
          <h4 style="color: #16a34a;">📋 Collection Instructions</h4>
          <ul>
            <li>Present this QR code at the event venue</li>
            <li>Have your ticket ID ready</li>
            <li>Bring a valid ID for verification</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>Felicity EMS Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;
};

module.exports = exports;