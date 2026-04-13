const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
require('./config/db');

// ===== ROUTES =====
const app = express();
const PORT = process.env.PORT || 3000;

// ===== CORS =====
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ===== ROUTES =====
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ===== API DOCUMENTATION =====
app.get('/api/docs', (req, res) => {
    res.json({
        status: 'success',
        message: 'API Documentation',
        endpoints: {
      auth: {
        login: '/api/auth/login - POST',
        register: '/api/auth/register - POST',
        logout: '/api/auth/logout - POST',
        profile: '/api/auth/me - GET',
        forgot_password: '/api/auth/forgot-password - POST',
        verify_reset_otp: '/api/auth/verify-reset-otp - POST',
        reset_password: '/api/auth/reset-password - POST'
      },
            users: { list: '/api/users - GET', detail: '/api/users/:id - GET' }
        }
    });
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

module.exports = app;