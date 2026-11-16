
require('dotenv').config();

const mongoose = require('mongoose');
const WeeklyJournal = require('../models/WeeklyJournal');

const checkDuplicates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected.');

    const duplicates = await WeeklyJournal.aggregate([
      {
        $group: {
          _id: {
            student: '$student',
            weekNumber: '$weekNumber'
          },
          count: { $sum: 1 },
          journalIds: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicates.length === 0) {
      console.log('No duplicate weekly journals found!');
      console.log('Safe to proceed with the unique index.');
    } else {
      console.log('Duplicate weekly journals found:');

      duplicates.forEach((duplicate) => {
        console.log({
          student: duplicate._id.student,
          weekNumber: duplicate._id.weekNumber,
          count: duplicate.count,
          journalIds: duplicate.journalIds
        });
      });

      console.log('Do not create the unique index yet.');
    }

  } catch (error) {
    console.error('Duplicate check failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

checkDuplicates();
