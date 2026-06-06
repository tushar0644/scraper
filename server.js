const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const otpRoutes = require('./routes/otpRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (login.html, index.html, style.css, etc.)
app.use(express.static(path.join(__dirname, './')));

// API Routes
app.use('/api', otpRoutes);

// Root fallback (redirects normal users to login page by default)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Admin Dashboard route mapping helper
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Database Connection Structure (Placeholder connection)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aaagaaz';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connection initialized successfully.');
  })
  .catch((err) => {
    console.warn('MongoDB local connection omitted (database operations will run in placeholder mode):', err.message);
  });

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` Aaagaaz 4.0 Server running on port ${PORT}`);
  console.log(` User Login Page:    http://localhost:${PORT}/`);
  console.log(` Admin Dashboard:   http://localhost:${PORT}/admin`);
  console.log(`===================================================`);
});
