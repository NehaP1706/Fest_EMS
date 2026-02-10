const axios = require('axios');

/**
 * Send event notification to Discord webhook
 * @param {String} webhookUrl - Discord webhook URL
 * @param {Object} event - Event object
 * @param {Object} organizer - Organizer object
 * @param {String} action - Action type: 'created', 'published', 'updated', 'cancelled'
 */
async function sendDiscordNotification(webhookUrl, event, organizer, action = 'published') {
  if (!webhookUrl || !webhookUrl.includes('discord.com/api/webhooks/')) {
    return; // No webhook or invalid URL
  }

  try {
    // Determine embed color based on action
    const colors = {
      created: 0x5865F2,    // Discord Blurple
      published: 0x57F287,  // Green
      updated: 0xFEE75C,    // Yellow
      cancelled: 0xED4245,  // Red
    };

    // Determine action emoji
    const emojis = {
      created: '📝',
      published: '🎉',
      updated: '🔄',
      cancelled: '❌',
    };

    // Format dates
    const formatDate = (date) => {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Build embed fields
    const fields = [
      {
        name: '📅 Event Date',
        value: `${formatDate(event.eventStartDate)} - ${formatDate(event.eventEndDate)}`,
        inline: false,
      },
      {
        name: '⏰ Registration Deadline',
        value: formatDate(event.registrationDeadline),
        inline: true,
      },
      {
        name: '🎟️ Event Type',
        value: event.eventType === 'normal' ? 'Regular Event' : 'Merchandise Sale',
        inline: true,
      },
    ];

    // Add eligibility
    const eligibilityText = 
      event.eligibility === 'all' ? 'All Participants' :
      event.eligibility === 'iiit-only' ? 'IIIT Students Only' :
      'Non-IIIT Participants Only';
    
    fields.push({
      name: '👥 Eligibility',
      value: eligibilityText,
      inline: true,
    });

    // Add fee for normal events
    if (event.eventType === 'normal') {
      fields.push({
        name: '💰 Registration Fee',
        value: event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`,
        inline: true,
      });
    }

    // Add registration limit
    if (event.registrationLimit) {
      fields.push({
        name: '📊 Capacity',
        value: `${event.currentRegistrations || 0} / ${event.registrationLimit}`,
        inline: true,
      });
    } else {
      fields.push({
        name: '📊 Capacity',
        value: 'Unlimited',
        inline: true,
      });
    }

    // Add tags if present
    if (event.tags && event.tags.length > 0) {
      fields.push({
        name: '🏷️ Tags',
        value: event.tags.join(', '),
        inline: false,
      });
    }

    // Build the Discord embed
    const embed = {
      title: `${emojis[action]} ${event.name}`,
      description: event.description,
      color: colors[action] || 0x5865F2,
      fields: fields,
      footer: {
        text: `${organizer.name} • ${organizer.category}`,
      },
      timestamp: new Date().toISOString(),
    };

    // Add action-specific message
    let content = '';
    if (action === 'published') {
      content = `@everyone **New Event Published!**`;
    } else if (action === 'updated') {
      content = `**Event Updated:** ${event.name}`;
    } else if (action === 'cancelled') {
      content = `⚠️ **Event Cancelled:** ${event.name}`;
    }

    // Send to Discord
    const response = await axios.post(webhookUrl, {
      content: content,
      embeds: [embed],
      username: 'Felicity EMS',
      avatar_url: 'https://i.imgur.com/4M34hi2.png', // Optional: Add your logo URL
    });

    console.log('✅ Discord notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending Discord notification:', error.response?.data || error.message);
    return false;
  }
}

module.exports = { sendDiscordNotification };