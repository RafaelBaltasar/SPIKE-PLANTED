
const mongoose = require('mongoose');
const WeeklyJournal = require('../models/WeeklyJournal');
const Student = require('../models/Student');

// Validate journal dates
const validateDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return false;
  }

  return end >= start;
};

// STUDENT: GET OWN WEEKLY JOURNALS
exports.getMyJournals = async (req, res) => {
  try {
    if (!req.user.student) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    const journals = await WeeklyJournal.find({
      student: req.user.student
    }).sort({ weekNumber: 1 });

    return res.status(200).json({
      success: true,
      count: journals.length,
      journals
    });

  } catch (error) {
    console.error('Get journals error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve weekly journals.'
    });
  }
};

// STUDENT: CREATE WEEKLY JOURNAL
exports.createJournal = async (req, res) => {
  try {
    if (!req.user.student) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    const {
      weekNumber,
      startDate,
      endDate,
      activities,
      learnings,
      challenges
    } = req.body || {};

    // Validate week number
    if (
      !Number.isInteger(weekNumber) ||
      weekNumber < 1 ||
      weekNumber > 53
    ) {
      return res.status(400).json({
        success: false,
        message: 'Week number must be between 1 and 53.'
      });
    }

    // Validate required text fields
    if (
      typeof activities !== 'string' ||
      !activities.trim() ||
      typeof learnings !== 'string' ||
      !learnings.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Activities and learnings are required.'
      });
    }

    if (
      activities.trim().length > 5000 ||
      learnings.trim().length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Activities and learnings must not exceed 5000 characters.'
      });
    }

    // Validate optional challenges
    if (
      challenges !== undefined &&
      typeof challenges !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Challenges must be valid text.'
      });
    }

    if ((challenges || '').trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Challenges must not exceed 5000 characters.'
      });
    }

    // Validate reporting dates
    if (
      !startDate ||
      !endDate ||
      !validateDates(startDate, endDate)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid dates. End date cannot be earlier than start date.'
      });
    }

    // Confirm student profile exists
    const studentExists = await Student.exists({
      _id: req.user.student
    });

    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    // Prevent duplicate journal for the same week
    const existingJournal = await WeeklyJournal.findOne({
      student: req.user.student,
      weekNumber
    });

    if (existingJournal) {
      return res.status(409).json({
        success: false,
        message: 'A journal for this week already exists.'
      });
    }

    const journal = await WeeklyJournal.create({
      student: req.user.student,
      weekNumber,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      activities: activities.trim(),
      learnings: learnings.trim(),
      challenges: (challenges || '').trim(),
      status: 'Draft'
    });

    return res.status(201).json({
      success: true,
      message: 'Weekly journal created successfully!',
      journal
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A journal for this week already exists.'
      });
    }

    console.error('Create journal error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to create weekly journal.'
    });
  }
};

// STUDENT: UPDATE OWN DRAFT JOURNAL
exports.updateJournal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal ID.'
      });
    }

    if (!req.user.student) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    const journal = await WeeklyJournal.findOne({
      _id: id,
      student: req.user.student
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Weekly journal not found.'
      });
    }

    if (journal.status !== 'Draft') {
      return res.status(403).json({
        success: false,
        message: 'Only draft journals can be edited.'
      });
    }

    const {
      weekNumber,
      startDate,
      endDate,
      activities,
      learnings,
      challenges
    } = req.body || {};

    // Validate updated week number
    if (
      weekNumber !== undefined &&
      (
        !Number.isInteger(weekNumber) ||
        weekNumber < 1 ||
        weekNumber > 53
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Week number must be between 1 and 53.'
      });
    }

    // Validate updated text fields
    if (
      activities !== undefined &&
      (
        typeof activities !== 'string' ||
        !activities.trim() ||
        activities.trim().length > 5000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Activities must contain valid text and not exceed 5000 characters.'
      });
    }

    if (
      learnings !== undefined &&
      (
        typeof learnings !== 'string' ||
        !learnings.trim() ||
        learnings.trim().length > 5000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Learnings must contain valid text and not exceed 5000 characters.'
      });
    }

    if (
      challenges !== undefined &&
      (
        typeof challenges !== 'string' ||
        challenges.trim().length > 5000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Challenges must be valid text and not exceed 5000 characters.'
      });
    }

    // Use existing dates when they are not being updated
    const newStartDate = startDate !== undefined
      ? startDate
      : journal.startDate;

    const newEndDate = endDate !== undefined
      ? endDate
      : journal.endDate;

    if (!validateDates(newStartDate, newEndDate)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid dates. End date cannot be earlier than start date.'
      });
    }

    // Check duplicate week if week number changes
    if (
      weekNumber !== undefined &&
      weekNumber !== journal.weekNumber
    ) {
      const duplicate = await WeeklyJournal.findOne({
        student: req.user.student,
        weekNumber,
        _id: { $ne: journal._id }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'A journal for this week already exists.'
        });
      }

      journal.weekNumber = weekNumber;
    }

    if (startDate !== undefined) {
      journal.startDate = new Date(startDate);
    }

    if (endDate !== undefined) {
      journal.endDate = new Date(endDate);
    }

    if (activities !== undefined) {
      journal.activities = activities.trim();
    }

    if (learnings !== undefined) {
      journal.learnings = learnings.trim();
    }

    if (challenges !== undefined) {
      journal.challenges = challenges.trim();
    }

    await journal.save();

    return res.status(200).json({
      success: true,
      message: 'Weekly journal updated successfully!',
      journal
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A journal for this week already exists.'
      });
    }

    console.error('Update journal error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to update weekly journal.'
    });
  }
};

// STUDENT: SUBMIT JOURNAL FOR REVIEW
exports.submitJournal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal ID.'
      });
    }

    if (!req.user.student) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    // Only the owner can submit their draft
    const journal = await WeeklyJournal.findOneAndUpdate(
      {
        _id: id,
        student: req.user.student,
        status: 'Draft'
      },
      {
        $set: {
          status: 'Submitted'
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Draft journal not found. It may already have been submitted or reviewed.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Weekly journal submitted successfully!',
      journal
    });

  } catch (error) {
    console.error('Submit journal error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to submit weekly journal.'
    });
  }
};
