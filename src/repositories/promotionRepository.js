const pool = require('../config/db');

// --- PUBLIC ---
const getActivePromotions = async ({ page, limit }) => {
	const offset = (page - 1) * limit;

	const countResult = await pool.query(
		`SELECT COUNT(*)::int AS total_items
         FROM khuyen_mai
         WHERE trang_thai = 'active'
           AND (ngay_bat_dau IS NULL OR ngay_bat_dau <= CURRENT_TIMESTAMP)
           AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= CURRENT_TIMESTAMP)`
	);

	const totalItems = countResult.rows[0].total_items;

	const promotionsResult = await pool.query(
		`SELECT khuyen_mai_id AS promotion_id, tieu_de AS title, kieu_giam_gia AS discount_type,
                gia_tri AS value, gia_tri_don_hang_toi_thieu AS min_order_value,
                ngay_bat_dau AS start_date, ngay_ket_thuc AS end_date
         FROM khuyen_mai
         WHERE trang_thai = 'active'
           AND (ngay_bat_dau IS NULL OR ngay_bat_dau <= CURRENT_TIMESTAMP)
           AND (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= CURRENT_TIMESTAMP)
         ORDER BY ngay_ket_thuc ASC NULLS LAST
         LIMIT $1 OFFSET $2`,
		[limit, offset]
	);

	return {
		promotions: promotionsResult.rows,
		pagination: {
			total_items: totalItems,
			total_pages: Math.max(1, Math.ceil(totalItems / limit)),
			current_page: page,
			limit,
		},
	};
};

// Lấy danh sách sản phẩm/biến thể thuộc về một khuyến mãi
const getPromotionProducts = async (promotionId) => {
	const result = await pool.query(
		`SELECT san_pham_id AS product_id, bien_the_id AS variant_id
         FROM khuyen_mai_san_pham
         WHERE khuyen_mai_id = $1`,
		[promotionId]
	);
	return result.rows;
};

// --- ADMIN ---
const getAllPromotionsAdmin = async ({ page, limit }) => {
	const offset = (page - 1) * limit;

	const countResult = await pool.query('SELECT COUNT(*)::int AS total_items FROM khuyen_mai');
	const totalItems = countResult.rows[0].total_items;

	const promotionsResult = await pool.query(
		`SELECT khuyen_mai_id AS promotion_id, tieu_de AS title, kieu_giam_gia AS discount_type,
                gia_tri AS value, gia_tri_don_hang_toi_thieu AS min_order_value,
                ngay_bat_dau AS start_date, ngay_ket_thuc AS end_date, trang_thai AS status
         FROM khuyen_mai
         ORDER BY khuyen_mai_id DESC
         LIMIT $1 OFFSET $2`,
		[limit, offset]
	);

	return {
		promotions: promotionsResult.rows,
		pagination: {
			total_items: totalItems,
			total_pages: Math.max(1, Math.ceil(totalItems / limit)),
			current_page: page,
			limit,
		},
	};
};

const getPromotionById = async (id) => {
	const promotionResult = await pool.query(
		`SELECT khuyen_mai_id AS promotion_id, tieu_de AS title, kieu_giam_gia AS discount_type,
                gia_tri AS value, gia_tri_don_hang_toi_thieu AS min_order_value,
                ngay_bat_dau AS start_date, ngay_ket_thuc AS end_date, trang_thai AS status
         FROM khuyen_mai WHERE khuyen_mai_id = $1`,
		[id]
	);

	if (promotionResult.rows.length === 0) return null;

	const promotion = promotionResult.rows[0];
	promotion.applicable_products = await getPromotionProducts(id);
	
	return promotion;
};

const createPromotion = async (payload) => {
	const {
		title, discount_type, value, min_order_value, start_date, end_date, status, applicable_products
	} = payload;

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Tạo khuyến mãi chính
		const result = await client.query(
			`INSERT INTO khuyen_mai (tieu_de, kieu_giam_gia, gia_tri, gia_tri_don_hang_toi_thieu, ngay_bat_dau, ngay_ket_thuc, trang_thai)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING khuyen_mai_id AS promotion_id`,
			[title, discount_type, value, min_order_value, start_date, end_date, status]
		);
		const promotionId = result.rows[0].promotion_id;

		// Map sản phẩm vào khuyến mãi
		if (Array.isArray(applicable_products) && applicable_products.length > 0) {
			for (const item of applicable_products) {
				await client.query(
					`INSERT INTO khuyen_mai_san_pham (khuyen_mai_id, san_pham_id, bien_the_id)
                     VALUES ($1, $2, $3)`,
					[promotionId, item.product_id, item.variant_id || null]
				);
			}
		}

		await client.query('COMMIT');
		return await getPromotionById(promotionId);
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

const updatePromotion = async (id, payload) => {
	const {
		title, discount_type, value, min_order_value, start_date, end_date, status, applicable_products
	} = payload;

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Cập nhật thông tin khuyến mãi
		await client.query(
			`UPDATE khuyen_mai
             SET tieu_de = $1, kieu_giam_gia = $2, gia_tri = $3, gia_tri_don_hang_toi_thieu = $4, 
                 ngay_bat_dau = $5, ngay_ket_thuc = $6, trang_thai = $7
             WHERE khuyen_mai_id = $8`,
			[title, discount_type, value, min_order_value, start_date, end_date, status, id]
		);

		// Nếu có gửi mảng applicable_products, tiến hành xóa cũ ghi mới
		if (Array.isArray(applicable_products)) {
			await client.query('DELETE FROM khuyen_mai_san_pham WHERE khuyen_mai_id = $1', [id]);
			
			for (const item of applicable_products) {
				await client.query(
					`INSERT INTO khuyen_mai_san_pham (khuyen_mai_id, san_pham_id, bien_the_id)
                     VALUES ($1, $2, $3)`,
					[id, item.product_id, item.variant_id || null]
				);
			}
		}

		await client.query('COMMIT');
		return await getPromotionById(id);
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

const deletePromotion = async (id) => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query('DELETE FROM khuyen_mai_san_pham WHERE khuyen_mai_id = $1', [id]);
		await client.query('DELETE FROM khuyen_mai WHERE khuyen_mai_id = $1', [id]);
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

module.exports = {
	getActivePromotions,
	getAllPromotionsAdmin,
	getPromotionById,
	createPromotion,
	updatePromotion,
	deletePromotion
};