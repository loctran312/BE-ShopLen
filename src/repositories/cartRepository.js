const pool = require('../config/db');

const getCartByUserId = async (userId) => {
    return pool.query(
        `SELECT 
            gh.gio_hang_id AS cart_id,
            gh.bien_the_id AS variant_id,
            gh.so_luong AS quantity,
            bt.sku,
            bt.slug,
            COALESCE(
                (
                    SELECT 
                        CASE 
                            WHEN km.kieu_giam_gia = 'percent' THEN GREATEST(0, bt.gia - (bt.gia * km.gia_tri / 100))
                            WHEN km.kieu_giam_gia = 'fixed' THEN GREATEST(0, bt.gia - km.gia_tri)
                            ELSE bt.gia 
                        END
                    FROM khuyen_mai_san_pham kmsp
                    JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
                    WHERE kmsp.san_pham_id = sp.san_pham_id
                      AND km.trang_thai = 'active'
                      AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= CURRENT_TIMESTAMP)
                      AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= CURRENT_TIMESTAMP)
                    ORDER BY km.khuyen_mai_id DESC
                    LIMIT 1
                ), 
                bt.gia
            ) AS price,

            bt.mau_sac AS color,
            bt.kich_co AS size,
            sp.san_pham_id AS product_id,
            sp.ten_san_pham AS product_name,
            COALESCE(tk.so_luong_ton, 0) AS stock_quantity,
            (
                SELECT duong_dan_anh 
                FROM hinh_anh_bien_the 
                WHERE bien_the_id = bt.bien_the_id 
                ORDER BY thu_tu_hien_thi ASC, hinh_anh_id ASC 
                LIMIT 1
            ) AS image_url
         FROM gio_hang gh
         INNER JOIN bien_the_san_pham bt ON gh.bien_the_id = bt.bien_the_id
         INNER JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
         LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
         WHERE gh.nguoi_dung_id = $1
         ORDER BY gh.gio_hang_id DESC`,
        [userId]
    );
};

const getCartItem = async (userId, variantId) => {
	return pool.query(
		'SELECT gio_hang_id, so_luong FROM gio_hang WHERE nguoi_dung_id = $1 AND bien_the_id = $2',
		[userId, variantId]
	);
};

const getVariantStock = async (variantId) => {
	return pool.query(
		`SELECT bt.bien_the_id, COALESCE(tk.so_luong_ton, 0) AS stock_quantity 
		 FROM bien_the_san_pham bt
		 LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
		 WHERE bt.bien_the_id = $1`,
		[variantId]
	);
};

const addItemToCart = async (userId, variantId, quantity) => {
	return pool.query(
		`INSERT INTO gio_hang (nguoi_dung_id, bien_the_id, so_luong)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (nguoi_dung_id, bien_the_id)
		 DO UPDATE SET so_luong = gio_hang.so_luong + EXCLUDED.so_luong
		 RETURNING gio_hang_id, bien_the_id, so_luong AS quantity`,
		[userId, variantId, quantity]
	);
};

const updateItemQuantity = async (userId, variantId, quantity) => {
	return pool.query(
		`UPDATE gio_hang 
		 SET so_luong = $3 
		 WHERE nguoi_dung_id = $1 AND bien_the_id = $2
		 RETURNING gio_hang_id, bien_the_id, so_luong AS quantity`,
		[userId, variantId, quantity]
	);
};

const removeItemFromCart = async (userId, variantId) => {
	return pool.query(
		'DELETE FROM gio_hang WHERE nguoi_dung_id = $1 AND bien_the_id = $2',
		[userId, variantId]
	);
};

const syncLocalCart = async (userId, localCartItems) => {
	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		for (const item of localCartItems) {
			const stockRes = await client.query(
				`SELECT COALESCE(tk.so_luong_ton, 0) AS stock_quantity
				 FROM bien_the_san_pham bt
				 LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
				 WHERE bt.bien_the_id = $1`,
				[item.variant_id]
			);

			if (stockRes.rows.length === 0) continue;

			const stock = Number(stockRes.rows[0].stock_quantity);

			const cartRes = await client.query(
				`SELECT so_luong FROM gio_hang WHERE nguoi_dung_id = $1 AND bien_the_id = $2`,
				[userId, item.variant_id]
			);
			const currentQtyInDb = cartRes.rows.length > 0 ? Number(cartRes.rows[0].so_luong) : 0;

			let qtyToAdd = item.quantity;
			if (currentQtyInDb + qtyToAdd > stock) {
				qtyToAdd = Math.max(0, stock - currentQtyInDb);
			}

			if (qtyToAdd > 0) {
				await client.query(
					`INSERT INTO gio_hang (nguoi_dung_id, bien_the_id, so_luong)
					 VALUES ($1, $2, $3)
					 ON CONFLICT (nguoi_dung_id, bien_the_id)
					 DO UPDATE SET so_luong = gio_hang.so_luong + EXCLUDED.so_luong`,
					[userId, item.variant_id, qtyToAdd]
				);
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

module.exports = {
	getCartByUserId,
	getCartItem,
	getVariantStock,
	addItemToCart,
	updateItemQuantity,
	removeItemFromCart,
    syncLocalCart,
};