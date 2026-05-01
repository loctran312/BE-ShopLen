const pool = require('../config/db');

const getAllProductTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM product_types');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi máy chủ' });
    }
};

module.exports = {
    getAllProductTypes,
};