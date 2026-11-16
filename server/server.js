const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const ojtRoutes = require('./routes/ojtRoutes');
const weeklyJournalRoutes = require('./routes/weeklyJournalRoutes');
const documentRoutes = require('./routes/documentRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────────────────────
// Health checks & root
// ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SPIKE PLANTED OJT Tracker API is running!'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/ojt', ojtRoutes);
app.use('/api/weekly-journals', weeklyJournalRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/coordinator', coordinatorRoutes);

// ─────────────────────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ─────────────────────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5 MB.'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the .env file.');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing from the .env file.');
    }

    // ✅ RECONNECTING TO REAL DATABASE
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas connected successfully!');

    app.listen(PORT, () => {
      console.log(`✅ SPIKE PLANTED API running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();