const pool = require('../config/db');

const updatePaymentStatus = async (orderId, status, transId = null) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

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

        if (status === 'paid') {
            const typeRes = await client.query(`
                SELECT sp.loai_san_pham_id, dh.tong_tien, dh.nguoi_dung_id
                FROM chi_tiet_don_hang ct
                JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id
                JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
                JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
                WHERE ct.don_hang_id = $1
                LIMIT 1
            `, [orderId]);

            if (typeRes.rows.length > 0 && typeRes.rows[0].loai_san_pham_id === 3) {
                const customerId = typeRes.rows[0].nguoi_dung_id;
                const totalAmount = typeRes.rows[0].tong_tien;

                await client.query(`UPDATE don_hang SET trang_thai = 'completed' WHERE don_hang_id = $1`, [orderId]);
                await client.query(`INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES ($1, 'completed')`, [orderId]);

                await client.query(`
                    INSERT INTO luot_quay (nguoi_dung_id, so_luot)
                    SELECT nguoi_dung_id, 1 FROM don_hang WHERE don_hang_id = $1
                    ON CONFLICT (nguoi_dung_id) 
                    DO UPDATE SET so_luot = LEAST(luot_quay.so_luot + 1, 3)
                `, [orderId]);

                const pointsEarned = Math.floor(Number(totalAmount) / 10000);
                if (pointsEarned > 0) {
                    await client.query(`
                        INSERT INTO diem_tich_luy (nguoi_dung_id, tong_diem) 
                        VALUES ($1, $2)
                        ON CONFLICT (nguoi_dung_id) 
                        DO UPDATE SET tong_diem = diem_tich_luy.tong_diem + EXCLUDED.tong_diem
                    `, [customerId, pointsEarned]);

                    await client.query(`
                        INSERT INTO lich_su_diem (nguoi_dung_id, so_diem, loai_giao_dich, tham_chieu_id, mo_ta)
                        VALUES ($1, $2, 'earn', $3, $4)
                    `, [customerId, pointsEarned, orderId, `Tích ${pointsEarned} điểm từ vé Workshop ${orderId}`]);
                }
            }
        }

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