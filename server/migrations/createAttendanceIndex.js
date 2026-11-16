
require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env')
});

const mongoose = require('mongoose');

const createAttendanceIndex = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false
    });

    console.log('Connected to MongoDB Atlas.');

    const collection = mongoose.connection.collection('ojtrecords');

    // Check for records with missing required index fields
    const invalidRecords = await collection.countDocuments({
      $or: [
        { student: null },
        { attendanceDate: { $exists: false } },
        { attendanceDate: null },
        { attendanceDate: '' }
      ]
    });

    if (invalidRecords > 0) {
      throw new Error(
        `${invalidRecords} records have missing index fields.`
      );
    }

    // Check for duplicate student/date combinations
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: {
            student: '$student',
            attendanceDate: '$attendanceDate'
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();

    if (duplicates.length > 0) {
      console.error('Duplicate attendance records found:');
      console.log(JSON.stringify(duplicates, null, 2));

      throw new Error('Cannot create unique index while duplicates exist.');
    }

    console.log('Attendance records passed validation.');

    // Create the unique compound index
    const indexName = await collection.createIndex(
      {
        student: 1,
        attendanceDate: 1
      },
      {
        unique: true,
        name: 'unique_student_attendance_date'
      }
    );

    console.log('Unique attendance index created:', indexName);

    // Verify the index
    const indexes = await collection.indexes();

    const createdIndex = indexes.find(
      (index) => index.name === 'unique_student_attendance_date'
    );

    if (!createdIndex || createdIndex.unique !== true) {
      throw new Error('Unique index verification failed.');
    }

    console.log('Index verification successful!');
    console.log('Student/date duplicates are now prevented.');

  } catch (error) {
    console.error('Index creation failed:', error.message);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
};

createAttendanceIndex();
