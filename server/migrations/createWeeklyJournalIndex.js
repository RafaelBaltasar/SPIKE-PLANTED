
require('dotenv').config();

const mongoose = require('mongoose');
const WeeklyJournal = require('../models/WeeklyJournal');

const createIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected.');

    await WeeklyJournal.collection.createIndex(
      {
        student: 1,
        weekNumber: 1
      },
      {
        unique: true,
        name: 'unique_student_week'
      }
    );

    console.log('Weekly Journal unique index created successfully!');

    const indexes = await WeeklyJournal.collection.indexes();

    console.log('Current Weekly Journal indexes:');
    console.log(indexes);

  } catch (error) {
    console.error('Index creation failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

createIndex();
