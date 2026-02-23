const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    await createAdminUser();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');

    const adminExists = await User.findOne({ 
      email: process.env.ADMIN_EMAIL 
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      
      await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        participantType: 'admin',
        isEmailVerified: true,
      });

      console.log('✓ Admin user created successfully');
      console.log(`  Email: ${process.env.ADMIN_EMAIL}`);
      console.log(`  Password: ${process.env.ADMIN_PASSWORD}`);
    }
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};

module.exports = connectDB;