const pool = require('../config/db');

const getAllCities = async () => pool.query('SELECT ma_tinh AS city_code, ten_tinh AS city_name FROM tinh_thanh');

const getWardsByCityCode = async (cityCode) => pool.query(
    'SELECT phuong_xa_id AS ward_code, ten_phuong_xa AS ward_name FROM phuong_xa WHERE ma_tinh = $1',
    [cityCode]
);

module.exports = {
    getAllCities,
    getWardsByCityCode
};