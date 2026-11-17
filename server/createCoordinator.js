
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');

const createCoordinator = async () => {
  try {
    // Check MongoDB environment variable
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from your .env file.');
    }

    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully!');

    const email = 'coordinator@spikeplanted.com';

    // Check if coordinator already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('Coordinator account already exists.');
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('Active:', existingUser.isActive);
      return;
    }

    // Create active coordinator account
    const coordinator = await User.create({
      fullName: 'OJT Coordinator',
      email,
      password: 'Coordinator123!',
      role: 'coordinator',
      isActive: true
    });

    console.log('\nCoordinator account created successfully!');
    console.log('Email:', coordinator.email);
    console.log('Role:', coordinator.role);
    console.log('Active:', coordinator.isActive);

  } catch (error) {
    console.error('\nCoordinator setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

createCoordinator();
