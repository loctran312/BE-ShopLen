const express = require('express');
const cors = require('cors');
const dns = require('dns');
require('dotenv').config();
require('./config/db');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

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
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const { apiDocs, renderDocsPage } = require('./docs/apiDocs');

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

// ===== API DOCUMENTATION =====
app.get('/api/docs', (req, res) => {
  res.type('html').send(renderDocsPage());
});

app.get('/api/docs.json', (req, res) => {
  res.json({
    status: 'success',
    message: 'API Documentation',
    ...apiDocs,
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