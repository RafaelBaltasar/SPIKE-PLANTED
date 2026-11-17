
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function createAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const email = 'admin@spikeplanted.com';
    const password = 'Admin123!';

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('Admin account already exists.');
      console.log('Email:', email);
      return;
    }

    const admin = await User.create({
      fullName: 'SPIKE PLANTED Administrator',
      email,
      password,
      role: 'admin',
      isActive: true
    });

    console.log('Admin account created successfully!');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Password:', password);

  } catch (error) {
    console.error('Error creating Admin:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
