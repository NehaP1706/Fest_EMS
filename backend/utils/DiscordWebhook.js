const axios = require('axios');

async function sendDiscordNotification(webhookUrl, event, organizer, action = 'published') {
  if (!webhookUrl || !webhookUrl.includes('discord.com/api/webhooks/')) {
    return; 
  }

  try {
    const colors = {
      created: 0x5865F2,    
      published: 0x57F287,  
      updated: 0xFEE75C,    
      cancelled: 0xED4245,  
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const fields = [
      {
        name: 'Event Date',
        value: `${formatDate(event.eventStartDate)} - ${formatDate(event.eventEndDate)}`,
        inline: false,
      },
      {
        name: 'Registration Deadline',
        value: formatDate(event.registrationDeadline),
        inline: true,
      },
      {
        name: 'Event Type',
        value: event.eventType === 'normal' ? 'Regular Event' : 'Merchandise Sale',
        inline: true,
      },
    ];

    const eligibilityText = 
      event.eligibility === 'all' ? 'All Participants' :
      event.eligibility === 'iiit-only' ? 'IIIT Students Only' :
      'Non-IIIT Participants Only';
    
    fields.push({
      name: '👥 Eligibility',
      value: eligibilityText,
      inline: true,
    });

    if (event.eventType === 'normal') {
      fields.push({
        name: 'Registration Fee',
        value: event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`,
        inline: true,
      });
    }

    if (event.registrationLimit) {
      fields.push({
        name: 'Capacity',
        value: `${event.currentRegistrations || 0} / ${event.registrationLimit}`,
        inline: true,
      });
    } else {
      fields.push({
        name: 'Capacity',
        value: 'Unlimited',
        inline: true,
      });
    }

    if (event.tags && event.tags.length > 0) {
      fields.push({
        name: 'Tags',
        value: event.tags.join(', '),
        inline: false,
      });
    }

    const embed = {
      title: `${event.name}`,
      description: event.description,
      color: colors[action] || 0x5865F2,
      fields: fields,
      footer: {
        text: `${organizer.name} • ${organizer.category}`,
      },
      timestamp: new Date().toISOString(),
    };

    let content = '';
    if (action === 'published') {
      content = `@everyone **New Event Published!**`;
    } else if (action === 'updated') {
      content = `**Event Updated:** ${event.name}`;
    } else if (action === 'cancelled') {
      content = `**Event Cancelled:** ${event.name}`;
    }

    const response = await axios.post(webhookUrl, {
      content: content,
      embeds: [embed],
      username: 'Felicity EMS',
      avatar_url: 'https://i.imgur.com/4M34hi2.png', 
    });

    return true;
  } catch (error) {
    return false;
  }
}

module.exports = { sendDiscordNotification };