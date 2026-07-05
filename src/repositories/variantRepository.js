const pool = require("../config/db");

const deleteVariant = async (variantId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query('DELETE FROM hinh_anh_bien_the WHERE bien_the_id = $1', [variantId]);

        await client.query('DELETE FROM ton_kho WHERE bien_the_id = $1', [variantId]);

        await client.query('DELETE FROM gio_hang WHERE bien_the_id = $1', [variantId]);
        await client.query('DELETE FROM phieu_giam_gia_san_pham WHERE bien_the_id = $1', [variantId]);

        await client.query('DELETE FROM hoi_thao_bien_the WHERE bien_the_id = $1', [variantId]);

        const result = await client.query('DELETE FROM bien_the_san_pham WHERE bien_the_id = $1', [variantId]);
        
        if (result.rowCount === 0) {
            throw new Error("Biến thể không tồn tại");
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
  deleteVariant,
};

