const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/inspector', require('./routes/inspector'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bot', require('./routes/bot'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TolSeva API is running', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
