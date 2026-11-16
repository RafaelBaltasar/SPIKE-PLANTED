
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const ojtRoutes = require('./routes/ojtRoutes');
const weeklyJournalRoutes = require('./routes/weeklyJournalRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SPIKE PLANTED OJT Tracker API is running!'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    database: mongoose.connection.readyState === 1
      ? 'Connected'
      : 'Disconnected'
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Attendance routes
app.use('/api/ojt', ojtRoutes);

// Weekly Journal routes
app.use('/api/weekly-journals', weeklyJournalRoutes);

// Connect to MongoDB and start server
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the .env file.');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing from the .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB Atlas connected successfully!');

    app.listen(PORT, () => {
      console.log(`SPIKE PLANTED API running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
