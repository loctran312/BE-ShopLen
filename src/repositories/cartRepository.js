const pool = require('../config/db');

// Lấy toàn bộ sản phẩm trong giỏ hàng kèm thông tin chi tiết sản phẩm và ảnh đại diện
const getCartByUserId = async (userId) => {
	return pool.query(
		`SELECT 
			gh.gio_hang_id AS cart_id,
			gh.bien_the_id AS variant_id,
			gh.so_luong AS quantity,
			bt.sku,
			bt.slug,
			bt.gia AS price,
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

// Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng của user chưa
const getCartItem = async (userId, variantId) => {
	return pool.query(
		'SELECT gio_hang_id, so_luong FROM gio_hang WHERE nguoi_dung_id = $1 AND bien_the_id = $2',
		[userId, variantId]
	);
};

// Lấy số lượng tồn kho hiện tại của một biến thể
const getVariantStock = async (variantId) => {
	return pool.query(
		`SELECT bt.bien_the_id, COALESCE(tk.so_luong_ton, 0) AS stock_quantity 
		 FROM bien_the_san_pham bt
		 LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
		 WHERE bt.bien_the_id = $1`,
		[variantId]
	);
};

// Thêm sản phẩm mới hoặc cộng dồn số lượng nếu đã tồn tại (ON CONFLICT)
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

// Cập nhật đè số lượng (Sử dụng cho trường hợp thay đổi ở ô Input số lượng)
const updateItemQuantity = async (userId, variantId, quantity) => {
	return pool.query(
		`UPDATE gio_hang 
		 SET so_luong = $3 
		 WHERE nguoi_dung_id = $1 AND bien_the_id = $2
		 RETURNING gio_hang_id, bien_the_id, so_luong AS quantity`,
		[userId, variantId, quantity]
	);
};

// Xóa sản phẩm khỏi giỏ hàng
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
			// Lấy tồn kho hiện tại của biến thể
			const stockRes = await client.query(
				`SELECT COALESCE(tk.so_luong_ton, 0) AS stock_quantity
				 FROM bien_the_san_pham bt
				 LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
				 WHERE bt.bien_the_id = $1`,
				[item.variant_id]
			);

			// Nếu biến thể không tồn tại, bỏ qua món này và tiếp tục vòng lặp
			if (stockRes.rows.length === 0) continue;

			const stock = Number(stockRes.rows[0].stock_quantity);

			// Lấy số lượng đã có sẵn trong giỏ hàng DB của user
			const cartRes = await client.query(
				`SELECT so_luong FROM gio_hang WHERE nguoi_dung_id = $1 AND bien_the_id = $2`,
				[userId, item.variant_id]
			);
			const currentQtyInDb = cartRes.rows.length > 0 ? Number(cartRes.rows[0].so_luong) : 0;

			// Tính toán số lượng tối đa được phép thêm
			let qtyToAdd = item.quantity;
			if (currentQtyInDb + qtyToAdd > stock) {
				// Chỉ thêm đúng phần còn thiếu cho tới khi đạt mốc tồn kho tối đa
				qtyToAdd = Math.max(0, stock - currentQtyInDb);
			}

			// Thực hiện UPSERT (Insert hoặc Update)
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