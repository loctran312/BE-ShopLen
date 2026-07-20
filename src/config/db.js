const { Pool } = require('pg');

require('./env');

const useConnectionString = Boolean(process.env.DATABASE_URL);

const isSslHost = (value = '') => /render\.com$/i.test(value) || /render\.com/i.test(value);

const shouldUseSsl = () => {
    if (process.env.DB_SSL === 'true') {
        return true;
    }

    if (process.env.DB_SSL === 'false') {
        return false;
    }

    if (useConnectionString) {
        try {
            const connectionUrl = new URL(process.env.DATABASE_URL);
            return isSslHost(connectionUrl.hostname);
        } catch {
            return false;
        }
    }

    return isSslHost(process.env.DB_HOST || '');
};

const sslConfig = shouldUseSsl() ? { rejectUnauthorized: false } : false;

const pool = new Pool(
    useConnectionString
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: sslConfig,
        }
        : {
            user: process.env.DB_USER || 'shoplen_user',
            password: process.env.DB_PASSWORD || 'password',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'shoplen',
            ssl: sslConfig,
        }
);

if (process.env.NODE_ENV !== 'test') {
    pool.connect()
        .then(() => console.log('Connected to PostgreSQL database'))
        .catch(err => console.error('Error connecting to PostgreSQL database:', err));
}

module.exports = pool;