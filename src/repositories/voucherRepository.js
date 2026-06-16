const pool = require('../config/db');

// --- PUBLIC ---

const getAvailableVouchers = async ({ page, limit }) => {
	const offset = (page - 1) * limit;

	const countResult = await pool.query(
		`SELECT COUNT(*)::int AS total_items
         FROM phieu_giam_gia
         WHERE (ngay_bat_dau IS NULL OR ngay_bat_dau <= CURRENT_TIMESTAMP)
           AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= CURRENT_TIMESTAMP)
           AND (so_luong IS NULL OR da_dung < so_luong)`
	);

	const totalItems = countResult.rows[0].total_items;

	const vouchersResult = await pool.query(
		`SELECT phieu_giam_gia_id AS voucher_id,
                ma AS code,
                ten_phieu AS voucher_name,
                kieu_giam_gia AS discount_type,
                gia_tri AS value,
                gia_tri_toi_thieu AS minimum_value,
                giam_toi_da AS max_discount,
                so_luong AS quantity,
                da_dung AS used_count,
                ngay_bat_dau AS start_date,
                ngay_ket_thuc AS end_date
         FROM phieu_giam_gia
         WHERE (ngay_bat_dau IS NULL OR ngay_bat_dau <= CURRENT_TIMESTAMP)
           AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= CURRENT_TIMESTAMP)
           AND (so_luong IS NULL OR da_dung < so_luong)
         ORDER BY ngay_ket_thuc ASC NULLS LAST
         LIMIT $1 OFFSET $2`,
		[limit, offset]
	);

	return {
		vouchers: vouchersResult.rows,
		pagination: {
			total_items: totalItems,
			total_pages: Math.max(1, Math.ceil(totalItems / limit)),
			current_page: page,
			limit,
		},
	};
};

const getVoucherByCode = async (code) => {
	return pool.query(
		`SELECT phieu_giam_gia_id AS voucher_id, ma AS code, ten_phieu AS voucher_name, 
                kieu_giam_gia AS discount_type, gia_tri AS value, gia_tri_toi_thieu AS minimum_value, 
                giam_toi_da AS max_discount, so_luong AS quantity, da_dung AS used_count, 
                ngay_bat_dau AS start_date, ngay_ket_thuc AS end_date
         FROM phieu_giam_gia
         WHERE ma = $1`,
		[code]
	);
};

const getUserVoucherUsage = async (userId, voucherId) => {
	return pool.query(
		`SELECT so_lan_su_dung 
         FROM nguoi_dung_phieu_giam_gia 
         WHERE nguoi_dung_id = $1 AND phieu_giam_gia_id = $2`,
		[userId, voucherId]
	);
};

// --- ADMIN CRUD ---

const getAllVouchersAdmin = async ({ page, limit }) => {
	const offset = (page - 1) * limit;

	const countResult = await pool.query('SELECT COUNT(*)::int AS total_items FROM phieu_giam_gia');
	const totalItems = countResult.rows[0].total_items;

	const vouchersResult = await pool.query(
		`SELECT phieu_giam_gia_id AS voucher_id, ma AS code, ten_phieu AS voucher_name, 
                kieu_giam_gia AS discount_type, gia_tri AS value, gia_tri_toi_thieu AS minimum_value, 
                giam_toi_da AS max_discount, so_luong AS quantity, da_dung AS used_count, 
                ngay_bat_dau AS start_date, ngay_ket_thuc AS end_date
         FROM phieu_giam_gia
         ORDER BY phieu_giam_gia_id DESC
         LIMIT $1 OFFSET $2`,
		[limit, offset]
	);

	return {
		vouchers: vouchersResult.rows,
		pagination: {
			total_items: totalItems,
			total_pages: Math.max(1, Math.ceil(totalItems / limit)),
			current_page: page,
			limit,
		},
	};
};

const getVoucherById = async (id) => {
	return pool.query(
		`SELECT phieu_giam_gia_id AS voucher_id, ma AS code, ten_phieu AS voucher_name, 
                kieu_giam_gia AS discount_type, gia_tri AS value, gia_tri_toi_thieu AS minimum_value, 
                giam_toi_da AS max_discount, so_luong AS quantity, da_dung AS used_count, 
                ngay_bat_dau AS start_date, ngay_ket_thuc AS end_date
         FROM phieu_giam_gia WHERE phieu_giam_gia_id = $1`,
		[id]
	);
};

const createVoucher = async (payload) => {
	const {
		code, voucher_name, discount_type, value, minimum_value, max_discount, quantity, start_date, end_date
	} = payload;

	const result = await pool.query(
		`INSERT INTO phieu_giam_gia (ma, ten_phieu, kieu_giam_gia, gia_tri, gia_tri_toi_thieu, giam_toi_da, so_luong, ngay_bat_dau, ngay_ket_thuc)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING phieu_giam_gia_id AS voucher_id, ma AS code, ten_phieu AS voucher_name, kieu_giam_gia AS discount_type, gia_tri AS value`,
		[code, voucher_name, discount_type, value, minimum_value, max_discount, quantity, start_date, end_date]
	);
	return result.rows[0];
};

const updateVoucher = async (id, payload) => {
	const {
		code, voucher_name, discount_type, value, minimum_value, max_discount, quantity, start_date, end_date
	} = payload;

	const result = await pool.query(
		`UPDATE phieu_giam_gia
         SET ma = $1, ten_phieu = $2, kieu_giam_gia = $3, gia_tri = $4, gia_tri_toi_thieu = $5, 
             giam_toi_da = $6, so_luong = $7, ngay_bat_dau = $8, ngay_ket_thuc = $9
         WHERE phieu_giam_gia_id = $10
         RETURNING phieu_giam_gia_id AS voucher_id, ma AS code`,
		[code, voucher_name, discount_type, value, minimum_value, max_discount, quantity, start_date, end_date, id]
	);
	return result.rows[0];
};

const deleteVoucher = async (id) => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		// Xóa ràng buộc khoá ngoại trước
		await client.query('DELETE FROM nguoi_dung_phieu_giam_gia WHERE phieu_giam_gia_id = $1', [id]);
		await client.query('DELETE FROM phieu_giam_gia_san_pham WHERE phieu_giam_gia_id = $1', [id]);
		// Xóa voucher
		await client.query('DELETE FROM phieu_giam_gia WHERE phieu_giam_gia_id = $1', [id]);
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

const filterVouchersAdmin = async (filters) => {
    const { page = 1, limit = 10, keyword, discount_types } = filters;
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;
    let whereClauses = [];

    // Tìm kiếm theo Mã voucher hoặc Tên voucher
    if (keyword) {
        whereClauses.push(`(ma ILIKE $${paramIndex} OR ten_phieu ILIKE $${paramIndex})`);
        params.push(`%${keyword}%`);
        paramIndex++;
    }

    // Lọc theo mảng kiểu giảm giá ('percent', 'fixed')
    if (Array.isArray(discount_types) && discount_types.length > 0) {
        whereClauses.push(`kieu_giam_gia = ANY($${paramIndex}::text[])`);
        params.push(discount_types);
        paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM phieu_giam_gia ${whereString}`, params);
    const totalItems = countRes.rows[0].total;

    const fetchParams = [...params, limit, offset];
    const vouchersRes = await pool.query(
        `SELECT phieu_giam_gia_id AS voucher_id, ma AS code, ten_phieu AS voucher_name, 
                kieu_giam_gia AS discount_type, gia_tri AS value, gia_tri_toi_thieu AS minimum_value, 
                giam_toi_da AS max_discount, so_luong AS quantity, da_dung AS used_count, 
                ngay_bat_dau AS start_date, ngay_ket_thuc AS end_date
         FROM phieu_giam_gia ${whereString}
         ORDER BY phieu_giam_gia_id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        fetchParams
    );

    return {
        vouchers: vouchersRes.rows,
        pagination: { total_items: totalItems, total_pages: Math.max(1, Math.ceil(totalItems / limit)), current_page: page, limit },
    };
};

module.exports = {
	getAvailableVouchers,
	getVoucherByCode,
	getUserVoucherUsage,
	getAllVouchersAdmin,
	getVoucherById,
	createVoucher,
	updateVoucher,
	deleteVoucher,
	filterVouchersAdmin,
};