const pool = require('../config/db');

const generateOrderId = async (client) => {
	// Lấy ngày hiện tại
	const now = new Date();
	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	
	const dateStr = `${yyyy}${mm}${dd}`; // YYYYMMDD
	const prefix = `DH-${dateStr}-`; // DH-YYYYMMDD-

	// Tìm mã đơn hàng lớn nhất trong ngày hôm nay
	const result = await client.query(
		`SELECT don_hang_id 
         FROM don_hang 
         WHERE don_hang_id LIKE $1 
         ORDER BY don_hang_id DESC 
         LIMIT 1`,
		[`${prefix}%`]
	);

	let nextSequence = 1;

	// Nếu đã có đơn hàng trong ngày, lấy số thứ tự cuối cùng cộng thêm 1
	if (result.rows.length > 0) {
		const lastOrderId = result.rows[0].don_hang_id; // VD: DH-20260616-0005
		const sequencePart = lastOrderId.split('-')[2]; // Lấy phần '0005'
		const lastSequence = parseInt(sequencePart, 10);
		
		if (!isNaN(lastSequence)) {
			nextSequence = lastSequence + 1;
		}
	}

	// Format lại số thứ tự thành 4 chữ số (VD: 0001, 0015, 0123)
	const sequenceStr = String(nextSequence).padStart(4, '0');

	return `${prefix}${sequenceStr}`;
};

// --- PUBLIC (NGƯỜI DÙNG) ---

const createOrder = async (userId, payload) => {
	const client = await pool.connect();

	try {
		await client.query('BEGIN');

		// Đọc giỏ hàng của user
		const cartResult = await client.query(
			`SELECT gh.bien_the_id, gh.so_luong, bt.gia, sp.ten_san_pham
             FROM gio_hang gh
             JOIN bien_the_san_pham bt ON gh.bien_the_id = bt.bien_the_id
             JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
             WHERE gh.nguoi_dung_id = $1`,
			[userId]
		);

		if (cartResult.rows.length === 0) {
			throw { statusCode: 400, message: 'Giỏ hàng của bạn đang trống' };
		}
		const cartItems = cartResult.rows;

		// Tính tổng tiền gốc
		let subTotal = 0;
		cartItems.forEach(item => {
			subTotal += Number(item.gia) * Number(item.so_luong);
		});

		// Khóa dòng và kiểm tra tồn kho (Tránh Race Condition)
		// Sắp xếp bien_the_id để tránh Deadlock nếu nhiều giao dịch chạy cùng lúc
		const variantIds = cartItems.map(item => item.bien_the_id).sort((a, b) => a - b);
		const stockResult = await client.query(
			`SELECT bien_the_id, so_luong_ton 
             FROM ton_kho 
             WHERE bien_the_id = ANY($1::int[]) 
             FOR UPDATE`,
			[variantIds]
		);

		const stockMap = new Map(stockResult.rows.map(row => [row.bien_the_id, row.so_luong_ton]));

		for (const item of cartItems) {
			const currentStock = stockMap.get(item.bien_the_id) || 0;
			if (currentStock < item.so_luong) {
				throw { 
					statusCode: 400, 
					message: `Sản phẩm "${item.ten_san_pham}" chỉ còn ${currentStock} sản phẩm trong kho, không đủ số lượng yêu cầu.` 
				};
			}
		}

		// Khóa dòng và kiểm tra Voucher (Nếu có)
		let voucherId = null;
		let discountAmount = 0;

		if (payload.phieu_giam_gia_code) {
			const voucherRes = await client.query(
				`SELECT * FROM phieu_giam_gia WHERE ma = $1 FOR UPDATE`,
				[payload.phieu_giam_gia_code]
			);

			if (voucherRes.rows.length === 0) {
				throw { statusCode: 404, message: 'Mã giảm giá không tồn tại' };
			}

			const voucher = voucherRes.rows[0];

			// Kiểm tra điều kiện voucher
			if (voucher.so_luong !== null && voucher.da_dung >= voucher.so_luong) {
				throw { statusCode: 400, message: 'Mã giảm giá đã hết lượt sử dụng' };
			}
			const now = new Date();
			if (voucher.ngay_bat_dau && new Date(voucher.ngay_bat_dau) > now) {
				throw { statusCode: 400, message: 'Mã giảm giá chưa đến thời gian áp dụng' };
			}
			if (voucher.ngay_ket_thuc && new Date(voucher.ngay_ket_thuc) < now) {
				throw { statusCode: 400, message: 'Mã giảm giá đã hết hạn' };
			}
			if (voucher.gia_tri_toi_thieu !== null && subTotal < Number(voucher.gia_tri_toi_thieu)) {
				throw { statusCode: 400, message: `Đơn hàng chưa đạt giá trị tối thiểu để dùng mã này` };
			}

			// Kiểm tra user đã dùng chưa
			const usageRes = await client.query(
				`SELECT so_lan_su_dung FROM nguoi_dung_phieu_giam_gia WHERE nguoi_dung_id = $1 AND phieu_giam_gia_id = $2`,
				[userId, voucher.phieu_giam_gia_id]
			);
			if (usageRes.rows.length > 0 && usageRes.rows[0].so_lan_su_dung > 0) {
				throw { statusCode: 400, message: 'Bạn đã sử dụng mã giảm giá này rồi' };
			}

			// Tính tiền giảm
			if (voucher.kieu_giam_gia === 'fixed') {
				discountAmount = Number(voucher.gia_tri);
			} else if (voucher.kieu_giam_gia === 'percent') {
				discountAmount = (subTotal * Number(voucher.gia_tri)) / 100;
				if (voucher.giam_toi_da !== null && discountAmount > Number(voucher.giam_toi_da)) {
					discountAmount = Number(voucher.giam_toi_da);
				}
			}

			if (discountAmount > subTotal) discountAmount = subTotal;
			voucherId = voucher.phieu_giam_gia_id;
		}

		const totalAmount = subTotal - discountAmount;
		const orderId = await generateOrderId(client);

		// Tạo Đơn hàng chính
		await client.query(
			`INSERT INTO don_hang (don_hang_id, nguoi_dung_id, tong_tien, phieu_giam_gia_id, so_tien_giam, phuong_xa_id, dia_chi_giao_hang, ten_nguoi_nhan, sdt_nguoi_nhan, trang_thai)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
			[
				orderId, userId, totalAmount, voucherId, discountAmount,
				payload.phuong_xa_id, payload.dia_chi_giao_hang, 
				payload.ten_nguoi_nhan, payload.sdt_nguoi_nhan
			]
		);

		// Tạo Chi tiết Đơn hàng & Trừ tồn kho
		for (const item of cartItems) {
			// Thêm vào chi tiết đơn
			await client.query(
				`INSERT INTO chi_tiet_don_hang (don_hang_id, bien_the_id, ten_san_pham, gia, so_luong)
                 VALUES ($1, $2, $3, $4, $5)`,
				[orderId, item.bien_the_id, item.ten_san_pham, item.gia, item.so_luong]
			);

			// Trừ kho
			await client.query(
				`UPDATE ton_kho SET so_luong_ton = so_luong_ton - $1 WHERE bien_the_id = $2`,
				[item.so_luong, item.bien_the_id]
			);
		}

		// Xử lý Voucher (Cộng lượt dùng)
		if (voucherId) {
			await client.query(
				`UPDATE phieu_giam_gia SET da_dung = da_dung + 1 WHERE phieu_giam_gia_id = $1`,
				[voucherId]
			);
			await client.query(
				`INSERT INTO nguoi_dung_phieu_giam_gia (phieu_giam_gia_id, nguoi_dung_id, so_lan_su_dung)
                 VALUES ($1, $2, 1)
                 ON CONFLICT (phieu_giam_gia_id, nguoi_dung_id) DO UPDATE SET so_lan_su_dung = nguoi_dung_phieu_giam_gia.so_lan_su_dung + 1`,
				[voucherId, userId]
			);
		}

		// Tạo record Thanh toán & Lịch sử
		const paymentMethod = payload.phuong_thuc_thanh_toan === 'MOMO' ? 'MOMO' : 'COD';
		await client.query(
			`INSERT INTO thanh_toan (don_hang_id, phuong_thuc, trang_thai) VALUES ($1, $2, 'pending')`,
			[orderId, paymentMethod]
		);

		await client.query(
			`INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES ($1, 'pending')`,
			[orderId]
		);

		// Xóa giỏ hàng
		await client.query(`DELETE FROM gio_hang WHERE nguoi_dung_id = $1`, [userId]);

		await client.query('COMMIT');
		return { order_id: orderId, total_amount: totalAmount, payment_method: paymentMethod };

	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

const getUserOrders = async (userId, { page, limit }) => {
	const offset = (page - 1) * limit;

	const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM don_hang WHERE nguoi_dung_id = $1', [userId]);
	const totalItems = countRes.rows[0].total;

	const ordersRes = await pool.query(
		`SELECT don_hang_id, trang_thai, tong_tien, so_tien_giam, ten_nguoi_nhan, dia_chi_giao_hang
         FROM don_hang
         WHERE nguoi_dung_id = $1
         ORDER BY don_hang_id DESC
         LIMIT $2 OFFSET $3`,
		[userId, limit, offset]
	);

	return {
		orders: ordersRes.rows,
		pagination: {
			total_items: totalItems,
			total_pages: Math.max(1, Math.ceil(totalItems / limit)),
			current_page: page,
			limit,
		},
	};
};

const getOrderDetail = async (orderId, userId = null) => {
	// Lấy thông tin chung của đơn hàng
	const orderQuery = userId 
		? `SELECT * FROM don_hang WHERE don_hang_id = $1 AND nguoi_dung_id = $2`
		: `SELECT * FROM don_hang WHERE don_hang_id = $1`;
	const params = userId ? [orderId, userId] : [orderId];

	const orderRes = await pool.query(orderQuery, params);
	if (orderRes.rows.length === 0) return null;

	const order = orderRes.rows[0];

	// Lấy danh sách sản phẩm trong đơn
	const detailRes = await pool.query(
		`SELECT chi_tiet_don_hang_id, bien_the_id, ten_san_pham, gia, so_luong 
         FROM chi_tiet_don_hang 
         WHERE don_hang_id = $1`,
		[orderId]
	);

	// Lấy thông tin thanh toán
	const paymentRes = await pool.query(
		`SELECT phuong_thuc, trang_thai, ma_tham_chieu FROM thanh_toan WHERE don_hang_id = $1`,
		[orderId]
	);

	order.items = detailRes.rows;
	order.payment = paymentRes.rows.length > 0 ? paymentRes.rows[0] : null;

	return order;
};

// --- ADMIN ---

const getAllOrdersAdmin = async ({ page, limit }) => {
	const offset = (page - 1) * limit;

	const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM don_hang');
	const totalItems = countRes.rows[0].total;

	const ordersRes = await pool.query(
		`SELECT don_hang_id, nguoi_dung_id, trang_thai, tong_tien, ten_nguoi_nhan, sdt_nguoi_nhan
         FROM don_hang
         ORDER BY don_hang_id DESC
         LIMIT $1 OFFSET $2`,
		[limit, offset]
	);

	return {
		orders: ordersRes.rows,
		pagination: {
			total_items: totalItems,
			total_pages: Math.max(1, Math.ceil(totalItems / limit)),
			current_page: page,
			limit,
		},
	};
};

const updateOrderStatus = async (orderId, newStatus) => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		const result = await client.query(
			`UPDATE don_hang SET trang_thai = $1 WHERE don_hang_id = $2 RETURNING don_hang_id`,
			[newStatus, orderId]
		);

		if (result.rows.length > 0) {
			await client.query(
				`INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES ($1, $2)`,
				[orderId, newStatus]
			);
		}

		await client.query('COMMIT');
		return result.rows.length > 0;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
};

const filterOrdersAdmin = async (filters) => {
    const { page = 1, limit = 10, keyword, statuses } = filters;
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;
    let whereClauses = [];

    if (keyword) {
        whereClauses.push(`(don_hang_id ILIKE $${paramIndex} OR ten_nguoi_nhan ILIKE $${paramIndex} OR sdt_nguoi_nhan ILIKE $${paramIndex})`);
        params.push(`%${keyword}%`);
        paramIndex++;
    }

    if (Array.isArray(statuses) && statuses.length > 0) {
        whereClauses.push(`trang_thai = ANY($${paramIndex}::text[])`);
        params.push(statuses);
        paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM don_hang ${whereString}`, params);
    const totalItems = countRes.rows[0].total;

    const fetchParams = [...params, limit, offset];
    const ordersRes = await pool.query(
        `SELECT don_hang_id, nguoi_dung_id, trang_thai, tong_tien, ten_nguoi_nhan, sdt_nguoi_nhan
         FROM don_hang ${whereString}
         ORDER BY don_hang_id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        fetchParams
    );

    return {
        orders: ordersRes.rows,
        pagination: { total_items: totalItems, total_pages: Math.max(1, Math.ceil(totalItems / limit)), current_page: page, limit },
    };
};

module.exports = {
	createOrder,
	getUserOrders,
	getOrderDetail,
	getAllOrdersAdmin,
	updateOrderStatus,
	filterOrdersAdmin,
};