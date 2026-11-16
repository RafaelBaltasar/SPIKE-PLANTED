
require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env')
});

const mongoose = require('mongoose');

// Convert a timestamp into a Philippine calendar date (YYYY-MM-DD)
const getPhilippineDate = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const values = {};

  parts.forEach(({ type, value }) => {
    values[type] = value;
  });

  return `${values.year}-${values.month}-${values.day}`;
};

const runMigration = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from server/.env');
    }

    // Disable automatic index creation during migration
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false
    });

    console.log('Connected to MongoDB Atlas.');

    // Use the raw collection to avoid Mongoose model index creation
    const collection = mongoose.connection.collection('ojtrecords');

    const records = await collection.find({}).toArray();

    console.log(`Total attendance records found: ${records.length}`);

    const updates = [];
    const duplicateGroups = new Map();
    const errors = [];

    // Inspect every record before making changes
    for (const record of records) {
      if (!record.student) {
        errors.push(`Record ${record._id}: missing student reference.`);
        continue;
      }

      if (!(record.date instanceof Date) ||
          Number.isNaN(record.date.getTime())) {
        errors.push(`Record ${record._id}: missing or invalid date.`);
        continue;
      }

      const calculatedDate = getPhilippineDate(record.date);

      if (record.attendanceDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(record.attendanceDate)) {
          errors.push(
            `Record ${record._id}: invalid attendanceDate format.`
          );
          continue;
        }

        if (record.attendanceDate !== calculatedDate) {
          errors.push(
            `Record ${record._id}: attendanceDate does not match its date.`
          );
          continue;
        }
      } else {
        updates.push({
          id: record._id,
          attendanceDate: calculatedDate
        });
      }

      const key = `${record.student.toString()}|${calculatedDate}`;

      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }

      duplicateGroups.get(key).push(record._id.toString());
    }

    // Stop if any record is invalid
    if (errors.length > 0) {
      console.error('\nMigration stopped. Problems found:');

      errors.forEach((error) => console.error('-', error));

      throw new Error('Fix the reported records before migrating.');
    }

    // Stop if the same student has multiple records for one date
    const duplicates = [...duplicateGroups.entries()]
      .filter(([, ids]) => ids.length > 1);

    if (duplicates.length > 0) {
      console.error('\nMigration stopped. Duplicate records found:');

      duplicates.forEach(([key, ids]) => {
        console.error(key, ids);
      });

      throw new Error('Resolve duplicate attendance records first.');
    }

    console.log('\nPre-migration checks passed.');
    console.log(`Records requiring updates: ${updates.length}`);

    // Update only the attendanceDate field
    for (const item of updates) {
      await collection.updateOne(
        { _id: item.id },
        {
          $set: {
            attendanceDate: item.attendanceDate
          }
        }
      );

      console.log(
        `Updated ${item.id}: ${item.attendanceDate}`
      );
    }

    // Verify that no records are missing attendanceDate
    const remaining = await collection.countDocuments({
      $or: [
        { attendanceDate: { $exists: false } },
        { attendanceDate: null },
        { attendanceDate: '' }
      ]
    });

    if (remaining > 0) {
      throw new Error(
        `${remaining} records are still missing attendanceDate.`
      );
    }

    console.log('\nMigration completed successfully!');
    console.log('All attendance records have attendanceDate.');
    console.log('No existing attendance records were deleted.');

  } catch (error) {
    console.error('\nMigration failed:', error.message);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
};

runMigration();
