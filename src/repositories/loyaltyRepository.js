const pool = require('../config/db');

// ==========================================
// ADMIN
// ==========================================

const createAdminReward = async (voucherId, requiredPoints) => {
    try {
        const voucherRes = await pool.query(`SELECT phieu_giam_gia_id FROM phieu_giam_gia WHERE phieu_giam_gia_id = $1`, [voucherId]);
        if (voucherRes.rows.length === 0) {
            const error = new Error('Voucher không tồn tại trong hệ thống.');
            error.statusCode = 404;
            throw error;
        }

        const res = await pool.query(
            `INSERT INTO muc_doi_diem (phieu_giam_gia_id, diem_yeu_cau, trang_thai) 
             VALUES ($1, $2, 'inactive') 
             RETURNING muc_doi_id AS reward_id, phieu_giam_gia_id AS voucher_id, diem_yeu_cau AS required_points, trang_thai AS status, ngay_tao AS created_at`,
            [voucherId, requiredPoints]
        );
        return res.rows[0];
    } catch (error) {
        if (error.code === '23505') {
            const customError = new Error('Voucher này đã được thiết lập một gói đổi điểm trước đó. Không thể tạo trùng.');
            customError.statusCode = 400;
            throw customError;
        }
        throw error;
    }
};

const deleteAdminReward = async (rewardId) => {
    const res = await pool.query(
        `DELETE FROM muc_doi_diem WHERE muc_doi_id = $1 RETURNING muc_doi_id`,
        [rewardId]
    );
    
    if (res.rowCount === 0) {
        const error = new Error('Không tìm thấy gói đổi điểm này để xóa.');
        error.statusCode = 404;
        throw error;
    }
    return true;
};

const getAdminRewards = async ({ page, limit }) => {
    const offset = (page - 1) * limit;

    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM muc_doi_diem');
    const totalItems = countRes.rows[0].total;

    const { rows } = await pool.query(
        `SELECT md.muc_doi_id AS reward_id, 
                md.diem_yeu_cau AS required_points, 
                md.trang_thai AS status, 
                md.ngay_tao AS created_at,
                p.phieu_giam_gia_id AS voucher_id, 
                p.ma AS voucher_code, 
                p.ten_phieu AS voucher_name, 
                p.kieu_giam_gia AS discount_type, 
                p.gia_tri AS discount_value
         FROM muc_doi_diem md
         JOIN phieu_giam_gia p ON md.phieu_giam_gia_id = p.phieu_giam_gia_id
         ORDER BY md.ngay_tao DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    return {
        rewards: rows,
        pagination: { total_items: totalItems, total_pages: Math.ceil(totalItems / limit), current_page: page, limit }
    };
};

const updateRewardStatus = async (rewardId, status) => {
    const res = await pool.query(
        `UPDATE muc_doi_diem SET trang_thai = $1 WHERE muc_doi_id = $2 RETURNING muc_doi_id`,
        [status, rewardId]
    );
    if (res.rowCount === 0) {
        const error = new Error('Không tìm thấy gói đổi điểm này.');
        error.statusCode = 404;
        throw error;
    }
    return true;
};

// ==========================================
// USER
// ==========================================

const getUserRewards = async ({ page, limit }) => {
    const offset = (page - 1) * limit;

    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM muc_doi_diem WHERE trang_thai = 'active'`);
    const totalItems = countRes.rows[0].total;

    const { rows } = await pool.query(
        `SELECT md.muc_doi_id AS reward_id, 
                md.diem_yeu_cau AS required_points, 
                p.ma AS voucher_code, 
                p.ten_phieu AS voucher_name, 
                p.kieu_giam_gia AS discount_type, 
                p.gia_tri AS discount_value
         FROM muc_doi_diem md
         JOIN phieu_giam_gia p ON md.phieu_giam_gia_id = p.phieu_giam_gia_id
         WHERE md.trang_thai = 'active'
         ORDER BY md.diem_yeu_cau ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    return {
        rewards: rows,
        pagination: { total_items: totalItems, total_pages: Math.ceil(totalItems / limit), current_page: page, limit }
    };
};

const getUserPointHistory = async (userId, { page, limit }) => {
    const offset = (page - 1) * limit;

    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM lich_su_diem WHERE nguoi_dung_id = $1`, [userId]);
    const totalItems = countRes.rows[0].total;

    const { rows } = await pool.query(
        `SELECT lich_su_diem_id AS history_id, 
                so_diem AS points_changed, 
                loai_giao_dich AS transaction_type, 
                tham_chieu_id AS reference_code, 
                mo_ta AS description, 
                ngay_tao AS created_at
         FROM lich_su_diem
         WHERE nguoi_dung_id = $1
         ORDER BY ngay_tao DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );

    return {
        history: rows,
        pagination: { total_items: totalItems, total_pages: Math.ceil(totalItems / limit), current_page: page, limit }
    };
};

const redeemVoucher = async (userId, rewardId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const configRes = await client.query(
            `SELECT md.diem_yeu_cau, p.phieu_giam_gia_id, p.ma AS voucher_code 
             FROM muc_doi_diem md
             JOIN phieu_giam_gia p ON md.phieu_giam_gia_id = p.phieu_giam_gia_id
             WHERE md.muc_doi_id = $1 AND md.trang_thai = 'active'`,
            [rewardId]
        );

        if (configRes.rows.length === 0) {
            throw { statusCode: 404, message: 'Gói đổi điểm này không tồn tại hoặc đã ngừng hoạt động' };
        }
        
        const { diem_yeu_cau, phieu_giam_gia_id, voucher_code } = configRes.rows[0];

        const ownershipRes = await client.query(
            `SELECT so_lan_su_dung FROM nguoi_dung_phieu_giam_gia WHERE nguoi_dung_id = $1 AND phieu_giam_gia_id = $2`,
            [userId, phieu_giam_gia_id]
        );

        if (ownershipRes.rows.length > 0) {
            if (ownershipRes.rows[0].so_lan_su_dung > 0) {
                throw { statusCode: 400, message: 'Bạn đã sử dụng voucher này rồi. Mỗi mã chỉ được dùng 1 lần.' };
            } else {
                throw { statusCode: 400, message: 'Bạn đang sở hữu voucher này trong ví. Hãy sử dụng trước khi đổi tiếp.' };
            }
        }

        const pointRes = await client.query(`SELECT tong_diem FROM diem_tich_luy WHERE nguoi_dung_id = $1 FOR UPDATE`, [userId]);
        const currentPoints = pointRes.rows.length > 0 ? pointRes.rows[0].tong_diem : 0;

        if (currentPoints < diem_yeu_cau) {
            throw { statusCode: 400, message: `Bạn không đủ điểm. Cần ${diem_yeu_cau} điểm, hiện tại có ${currentPoints} điểm.` };
        }

        await client.query(`UPDATE diem_tich_luy SET tong_diem = tong_diem - $1 WHERE nguoi_dung_id = $2`, [diem_yeu_cau, userId]);
        await client.query(`INSERT INTO nguoi_dung_phieu_giam_gia (phieu_giam_gia_id, nguoi_dung_id, so_lan_su_dung) VALUES ($1, $2, 0)`, [phieu_giam_gia_id, userId]);
        await client.query(
            `INSERT INTO lich_su_diem (nguoi_dung_id, so_diem, loai_giao_dich, tham_chieu_id, mo_ta) VALUES ($1, $2, 'redeem', $3, $4)`,
            [userId, -diem_yeu_cau, voucher_code, `Đổi ${diem_yeu_cau} điểm lấy Voucher ${voucher_code}`]
        );

        await client.query('COMMIT');
        return { voucher_id: phieu_giam_gia_id, voucher_code, points_deducted: diem_yeu_cau, remaining_points: currentPoints - diem_yeu_cau };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    createAdminReward,
    deleteAdminReward,
    getAdminRewards,
    updateRewardStatus,
    getUserRewards,
    getUserPointHistory,
    redeemVoucher
};