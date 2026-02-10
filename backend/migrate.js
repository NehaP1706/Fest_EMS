const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Organizer = require('./models/Organizer'); 

// Manually point to the .env file in the current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const migrate = async () => {
  try {
    // Check if the URI exists, otherwise use your local default
    const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/felicity_ems';
    
    console.log('Connecting to:', dbURI);
    await mongoose.connect(dbURI);
    console.log('Connected to Database...');

    // Find organizers where status contains double quotes
    const organizers = await Organizer.find({ status: /"/ });
    console.log(`Found ${organizers.length} records to clean.`);

    for (let org of organizers) {
      const cleanStatus = org.status.replace(/"/g, '');
      org.status = cleanStatus;
      await org.save();
      console.log(`Cleaned: ${org.name} -> ${cleanStatus}`);
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration Error:', err);
    process.exit(1);
  }
};

migrate();