const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
// Support Flutter web development (random ports), mobile, and React web frontends
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin === 'https://tolseva.gov.in'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection assurance middleware
const { isMongoAvailable, connect } = require('./config/db');
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    if (!isMongoAvailable()) {
      await connect();
    }
    next();
  } catch (err) {
    console.error('Database connection error in request handler:', err.message);
    return res.status(503).json({
      error: 'Database service is currently unavailable. Please verify MongoDB connection string and network access.',
      details: err.message
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/public'));
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/inspector', require('./routes/inspector'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bot', require('./routes/bot'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TolSeva API is running',
    demo_mode: process.env.DEMO_MODE !== 'false',
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
