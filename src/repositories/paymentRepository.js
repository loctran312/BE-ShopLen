const pool = require('../config/db');

const updatePaymentStatus = async (orderId, status, transId = null) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Cập nhật bảng thanh_toan
        let updatePaymentQuery = `UPDATE thanh_toan SET trang_thai = $1`;
        const queryParams = [status];
        
        if (transId) {
            updatePaymentQuery += `, ma_tham_chieu = $2 WHERE don_hang_id = $3`;
            queryParams.push(transId, orderId);
        } else {
            updatePaymentQuery += ` WHERE don_hang_id = $2`;
            queryParams.push(orderId);
        }
        await client.query(updatePaymentQuery, queryParams);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getPaymentInfo = async (orderId) => {
    const result = await pool.query(
        `SELECT tt.phuong_thuc, tt.trang_thai, tt.ma_tham_chieu, dh.tong_tien 
         FROM thanh_toan tt
         JOIN don_hang dh ON tt.don_hang_id = dh.don_hang_id
         WHERE tt.don_hang_id = $1`,
        [orderId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
};

module.exports = {
    updatePaymentStatus,
    getPaymentInfo
};