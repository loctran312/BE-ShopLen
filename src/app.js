const express = require('express');
const cors = require('cors');

require('./config/env');
require('./config/db');

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const variantRoutes = require('./routes/variants');
const locationRoutes = require('./routes/location');
const cartRoutes = require('./routes/cart');
const voucherRoutes = require('./routes/vouchers');
const promotionRoutes = require('./routes/promotions');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const workshopRoutes = require('./routes/workshops');
const wishlistRoutes = require('./routes/wishlist');
const inventoryRoutes = require('./routes/inventory');
const shipperRoutes = require('./routes/shippers');

const { apiDocs, renderDocsPage } = require('./docs/apiDocs');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api', shipperRoutes);

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

const swaggerDocs = require('./config/swagger');
swaggerDocs(app);

app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'API endpoint not found',
    });
});

app.use(errorMiddleware);

module.exports = app;