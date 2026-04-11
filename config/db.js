const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'shoplen_user',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'shoplen',
    ssl: process.env.DB_SSL === 'true' || (process.env.DB_HOST || '').includes('render.com')
        ? { rejectUnauthorized: false }
        : false
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Error connecting to PostgreSQL database:', err));

module.exports = pool;