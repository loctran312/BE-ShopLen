const pool = require('../config/db');

// --- USER API ---

const getSpinInfo = async (userId) => {
    await pool.query(
        `INSERT INTO luot_quay (nguoi_dung_id, so_luot) VALUES ($1, 0) ON CONFLICT DO NOTHING`,
        [userId]
    );

    const turnRes = await pool.query(`SELECT so_luot FROM luot_quay WHERE nguoi_dung_id = $1`, [userId]);
    
    const rewardsRes = await pool.query(
        `SELECT c.cau_hinh_qua_quay_id AS reward_id, c.loai_qua AS type, c.gia_tri AS value, c.so_luong_con_lai AS remaining,
                p.ma AS voucher_code, p.ten_phieu AS voucher_name
         FROM cau_hinh_qua_quay c
         LEFT JOIN phieu_giam_gia p ON c.loai_qua = 'voucher' AND c.gia_tri = p.phieu_giam_gia_id
         WHERE c.trang_thai = 'active'`
    );

    return {
        turn_count: turnRes.rows[0].so_luot,
        rewards: rewardsRes.rows
    };
};

const playSpin = async (userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const turnRes = await client.query(`SELECT so_luot FROM luot_quay WHERE nguoi_dung_id = $1 FOR UPDATE`, [userId]);
        if (turnRes.rows.length === 0 || turnRes.rows[0].so_luot <= 0) {
            throw { statusCode: 400, message: 'Bạn đã hết lượt quay. Hãy mua thêm hàng để nhận lượt!' };
        }

        const rewardsRes = await client.query(
            `SELECT * FROM cau_hinh_qua_quay 
             WHERE trang_thai = 'active' AND (so_luong_con_lai IS NULL OR so_luong_con_lai > 0) 
             FOR UPDATE`
        );

        const ownedVouchersRes = await client.query(`SELECT phieu_giam_gia_id FROM nguoi_dung_phieu_giam_gia WHERE nguoi_dung_id = $1`, [userId]);
        const ownedVouchers = new Set(ownedVouchersRes.rows.map(r => r.phieu_giam_gia_id));

        const noneReward = rewardsRes.rows.find(r => r.loai_qua === 'none');

        for (let reward of rewardsRes.rows) {
            if (reward.loai_qua === 'voucher' && ownedVouchers.has(reward.gia_tri)) {
                if (noneReward) {
                    noneReward.ty_le_thang = Number(noneReward.ty_le_thang) + Number(reward.ty_le_thang);
                }
                reward.ty_le_thang = 0; 
            }
        }

        let rand = Math.random() * 100;
        let cumulativeProb = 0;
        let wonReward = null;

        for (const reward of rewardsRes.rows) {
            cumulativeProb += Number(reward.ty_le_thang);
            if (rand <= cumulativeProb && Number(reward.ty_le_thang) > 0) {
                wonReward = reward;
                break;
            }
        }

        if (!wonReward) {
            wonReward = noneReward;
            if (!wonReward) throw { statusCode: 500, message: 'Hệ thống phần thưởng chưa được cấu hình chuẩn (Thiếu ô none)' };
        }

        await client.query(`UPDATE luot_quay SET so_luot = so_luot - 1 WHERE nguoi_dung_id = $1`, [userId]);

        if (wonReward.so_luong_con_lai !== null) {
            await client.query(
                `UPDATE cau_hinh_qua_quay SET so_luong_con_lai = so_luong_con_lai - 1 WHERE cau_hinh_qua_quay_id = $1`, 
                [wonReward.cau_hinh_qua_quay_id]
            );
        }

        await client.query(
            `INSERT INTO lich_su_quay (nguoi_dung_id, cau_hinh_qua_quay_id) VALUES ($1, $2)`, 
            [userId, wonReward.cau_hinh_qua_quay_id]
        );

        let rewardDetail = { reward_id: wonReward.cau_hinh_qua_quay_id, type: wonReward.loai_qua };

        if (wonReward.loai_qua === 'point') {
            await client.query(
                `INSERT INTO diem_tich_luy (nguoi_dung_id, tong_diem) VALUES ($1, $2) 
                 ON CONFLICT (nguoi_dung_id) DO UPDATE SET tong_diem = diem_tich_luy.tong_diem + EXCLUDED.tong_diem`,
                [userId, wonReward.gia_tri]
            );
            await client.query(
                `INSERT INTO lich_su_diem (nguoi_dung_id, so_diem, loai_giao_dich, mo_ta) VALUES ($1, $2, 'earn', 'Trúng thưởng từ Vòng quay may mắn')`,
                [userId, wonReward.gia_tri]
            );
            rewardDetail.message = `Chúc mừng bạn trúng ${wonReward.gia_tri} điểm thưởng!`;
            rewardDetail.value = wonReward.gia_tri;
        } else if (wonReward.loai_qua === 'voucher') {
            const vcRes = await client.query(`SELECT ma, ten_phieu FROM phieu_giam_gia WHERE phieu_giam_gia_id = $1`, [wonReward.gia_tri]);
            if (vcRes.rows.length > 0) {
                rewardDetail.message = `Chúc mừng bạn trúng Voucher: ${vcRes.rows[0].ten_phieu}`;
                rewardDetail.voucher_code = vcRes.rows[0].ma;
                
                await client.query(
                    `INSERT INTO nguoi_dung_phieu_giam_gia (nguoi_dung_id, phieu_giam_gia_id, so_lan_su_dung) VALUES ($1, $2, 0)
                     ON CONFLICT DO NOTHING`, 
                    [userId, wonReward.gia_tri]
                );
            }
        } else {
            rewardDetail.message = `Chúc bạn may mắn lần sau!`;
        }

        await client.query('COMMIT');
        return rewardDetail;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getSpinHistory = async (userId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM lich_su_quay WHERE nguoi_dung_id = $1`, [userId]);
    
    const historyRes = await pool.query(`
        SELECT l.ngay_tao AS won_at, c.loai_qua AS type, c.gia_tri AS value
        FROM lich_su_quay l
        JOIN cau_hinh_qua_quay c ON l.cau_hinh_qua_quay_id = c.cau_hinh_qua_quay_id
        WHERE l.nguoi_dung_id = $1
        ORDER BY l.lich_su_quay_id DESC LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return { 
        history: historyRes.rows, 
        pagination: { total_items: countRes.rows[0].total, current_page: page, limit } 
    };
};

// --- ADMIN API ---

const getAdminConfigs = async () => {
    const res = await pool.query(`
        SELECT c.*, p.ma AS voucher_code, p.ten_phieu AS voucher_name 
        FROM cau_hinh_qua_quay c
        LEFT JOIN phieu_giam_gia p ON c.loai_qua = 'voucher' AND c.gia_tri = p.phieu_giam_gia_id
        ORDER BY c.cau_hinh_qua_quay_id ASC
    `);
    return res.rows;
};

const checkTotalProbability = async (client, excludeId = null, newProbability = 0) => {
    let query = `SELECT SUM(ty_le_thang) AS total FROM cau_hinh_qua_quay WHERE trang_thai = 'active'`;
    const params = [];

    if (excludeId) {
        query += ` AND cau_hinh_qua_quay_id != $1`;
        params.push(excludeId);
    }

    const res = await client.query(query, params);
    const currentTotal = Number(res.rows[0].total) || 0;
    const addedProbability = Number(newProbability);

    if (currentTotal + addedProbability > 100) {
        throw { 
            statusCode: 400, 
            message: `Tổng tỷ lệ thắng của các phần thưởng đang hoạt động (active) không được vượt quá 100%. Đang dùng: ${currentTotal}%, Bạn muốn thêm: ${addedProbability}%.` 
        };
    }
};

const createAdminConfig = async (payload) => {
    const { loai_qua, gia_tri, ty_le_thang, so_luong_con_lai, trang_thai = 'active' } = payload;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        if (trang_thai === 'active') await checkTotalProbability(client, null, ty_le_thang);
        
        await client.query(
            `INSERT INTO cau_hinh_qua_quay (loai_qua, gia_tri, ty_le_thang, so_luong_con_lai, trang_thai) VALUES ($1, $2, $3, $4, $5)`,
            [loai_qua, gia_tri || 0, ty_le_thang, so_luong_con_lai, trang_thai]
        );
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK'); throw error;
    } finally { client.release(); }
};

const addTurnsToAllUsers = async () => {
    await pool.query(`
        INSERT INTO luot_quay (nguoi_dung_id, so_luot)
        SELECT nguoi_dung_id, 3 FROM nguoi_dung WHERE trang_thai = 'active'
        ON CONFLICT (nguoi_dung_id) DO UPDATE SET so_luot = 3
    `);
    return true;
};

const updateAdminConfig = async (id, payload) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const existRes = await client.query(`SELECT * FROM cau_hinh_qua_quay WHERE cau_hinh_qua_quay_id = $1`, [id]);
        if (existRes.rows.length === 0) {
            throw { statusCode: 404, message: 'Cấu hình phần thưởng không tồn tại' };
        }
        const current = existRes.rows[0];

        const newLoaiQua = payload.loai_qua !== undefined ? payload.loai_qua : current.loai_qua;
        const newGiaTri = payload.gia_tri !== undefined ? payload.gia_tri : current.gia_tri;
        const newTyLe = payload.ty_le_thang !== undefined ? payload.ty_le_thang : current.ty_le_thang;
        const newSoLuong = payload.so_luong_con_lai !== undefined ? payload.so_luong_con_lai : current.so_luong_con_lai;
        const newTrangThai = payload.trang_thai !== undefined ? payload.trang_thai : current.trang_thai;

        if (newTrangThai === 'active') {
            await checkTotalProbability(client, id, newTyLe);
        }

        await client.query(
            `UPDATE cau_hinh_qua_quay 
             SET loai_qua = $1, gia_tri = $2, ty_le_thang = $3, so_luong_con_lai = $4, trang_thai = $5
             WHERE cau_hinh_qua_quay_id = $6`,
            [newLoaiQua, newGiaTri, newTyLe, newSoLuong, newTrangThai, id]
        );

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK'); 
        throw error;
    } finally {
        client.release();
    }
};

const deleteAdminConfig = async (id) => {
    try {
        const res = await pool.query(
            `DELETE FROM cau_hinh_qua_quay WHERE cau_hinh_qua_quay_id = $1 RETURNING cau_hinh_qua_quay_id`, 
            [id]
        );
        if (res.rowCount === 0) {
            throw { statusCode: 404, message: 'Cấu hình phần thưởng không tồn tại' };
        }
        return true;
    } catch (error) {
        if (error.code === '23503') {
            throw { 
                statusCode: 400, 
                message: 'Không thể xóa phần thưởng này vì đã có người quay trúng. Vui lòng chuyển trạng thái sang Tạm ẩn (inactive).' 
            };
        }
        throw error;
    }
};

module.exports = { getSpinInfo, playSpin, getSpinHistory, getAdminConfigs, createAdminConfig, addTurnsToAllUsers, updateAdminConfig, deleteAdminConfig };