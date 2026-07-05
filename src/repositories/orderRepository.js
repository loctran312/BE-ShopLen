const pool = require('../config/db');

const generateOrderId = async (client) => {
	const now = new Date();
	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	
	const dateStr = `${yyyy}${mm}${dd}`; // YYYYMMDD
	const prefix = `DH-${dateStr}-`; // DH-YYYYMMDD-

	const result = await client.query(
		`SELECT don_hang_id 
         FROM don_hang 
         WHERE don_hang_id LIKE $1 
         ORDER BY don_hang_id DESC 
         LIMIT 1`,
		[`${prefix}%`]
	);

	let nextSequence = 1;

	if (result.rows.length > 0) {
		const lastOrderId = result.rows[0].don_hang_id;
		const sequencePart = lastOrderId.split('-')[2];
		const lastSequence = parseInt(sequencePart, 10);
		
		if (!isNaN(lastSequence)) {
			nextSequence = lastSequence + 1;
		}
	}

	const sequenceStr = String(nextSequence).padStart(4, '0');

	return `${prefix}${sequenceStr}`;
};

// --- PUBLIC (NGƯỜI DÙNG) ---

const createOrder = async (userId, payload) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const cartResult = await client.query(
            `SELECT gh.bien_the_id, gh.so_luong, bt.gia, sp.ten_san_pham,
                    (SELECT row_to_json(d) FROM (
                        SELECT km.kieu_giam_gia AS type, km.gia_tri AS value
                        FROM khuyen_mai_san_pham kmsp
                        JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
                        WHERE kmsp.san_pham_id = sp.san_pham_id
                          AND km.trang_thai = 'active'
                          AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= CURRENT_TIMESTAMP)
                          AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= CURRENT_TIMESTAMP)
                        ORDER BY km.khuyen_mai_id DESC
                        LIMIT 1
                    ) d) AS discount
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

        let subTotal = 0;
        cartItems.forEach(item => {
            let finalPrice = Number(item.gia);
            if (item.discount) {
                const discountValue = Number(item.discount.value);
                if (item.discount.type === 'percent') {
                    finalPrice = finalPrice - (finalPrice * discountValue / 100);
                } else if (item.discount.type === 'fixed') {
                    finalPrice = finalPrice - discountValue;
                }
                if (finalPrice < 0) finalPrice = 0;
            }
            item.finalPrice = finalPrice;
            subTotal += finalPrice * Number(item.so_luong);
        });

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
                throw { statusCode: 400, message: `Sản phẩm "${item.ten_san_pham}" không đủ số lượng yêu cầu.` };
            }
        }

        let shippingFee = 0;
        if (payload.shipping_method_id === 'GH_NHANH') {
            shippingFee = 32000;
        } else if (payload.shipping_method_id === 'GH_TIETKIEM') {
            shippingFee = 18000;
        } else {
            throw { statusCode: 400, message: 'Phương thức vận chuyển không hợp lệ' };
        }

        let voucherId = null;
        let discountAmount = 0;

        if (payload.phieu_giam_gia_code) {
            const voucherRes = await client.query(
                `SELECT * FROM phieu_giam_gia WHERE ma = $1 FOR UPDATE`,
                [payload.phieu_giam_gia_code]
            );

            if (voucherRes.rows.length === 0) throw { statusCode: 404, message: 'Mã giảm giá không tồn tại' };
            const voucher = voucherRes.rows[0];

            if (voucher.so_luong !== null && voucher.da_dung >= voucher.so_luong) throw { statusCode: 400, message: 'Mã giảm giá đã hết lượt sử dụng' };
            const now = new Date();
            if (voucher.ngay_bat_dau && new Date(voucher.ngay_bat_dau) > now) throw { statusCode: 400, message: 'Mã giảm giá chưa đến thời gian áp dụng' };
            if (voucher.ngay_ket_thuc && new Date(voucher.ngay_ket_thuc) < now) throw { statusCode: 400, message: 'Mã giảm giá đã hết hạn' };
            if (voucher.gia_tri_toi_thieu !== null && subTotal < Number(voucher.gia_tri_toi_thieu)) throw { statusCode: 400, message: `Đơn hàng chưa đạt giá trị tối thiểu` };

            const usageRes = await client.query(
                `SELECT so_lan_su_dung FROM nguoi_dung_phieu_giam_gia WHERE nguoi_dung_id = $1 AND phieu_giam_gia_id = $2`,
                [userId, voucher.phieu_giam_gia_id]
            );
            if (usageRes.rows.length > 0 && usageRes.rows[0].so_lan_su_dung > 0) throw { statusCode: 400, message: 'Bạn đã sử dụng mã giảm giá này rồi' };

            if (voucher.kieu_giam_gia === 'fixed') {
                discountAmount = Number(voucher.gia_tri);
                if (discountAmount > subTotal) discountAmount = subTotal;
            } else if (voucher.kieu_giam_gia === 'percent') {
                discountAmount = (subTotal * Number(voucher.gia_tri)) / 100;
                if (voucher.giam_toi_da !== null && discountAmount > Number(voucher.giam_toi_da)) discountAmount = Number(voucher.giam_toi_da);
                if (discountAmount > subTotal) discountAmount = subTotal;
            } else if (voucher.kieu_giam_gia === 'free_ship') {
                discountAmount = shippingFee; 
                if (voucher.giam_toi_da !== null && discountAmount > Number(voucher.giam_toi_da)) {
                    discountAmount = Number(voucher.giam_toi_da);
                }
            }

            voucherId = voucher.phieu_giam_gia_id;
        }

        const totalAmount = subTotal + shippingFee - discountAmount;
        const orderId = await generateOrderId(client);

        await client.query(
            `INSERT INTO don_hang (don_hang_id, nguoi_dung_id, tong_tien, phieu_giam_gia_id, so_tien_giam, phuong_xa_id, dia_chi_giao_hang, ten_nguoi_nhan, sdt_nguoi_nhan, trang_thai, phi_van_chuyen, phuong_thuc_giao_hang)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11)`,
            [
                orderId, userId, totalAmount, voucherId, discountAmount,
                payload.phuong_xa_id, payload.dia_chi_giao_hang, 
                payload.ten_nguoi_nhan, payload.sdt_nguoi_nhan,
                shippingFee, payload.shipping_method_id
            ]
        );

        for (const item of cartItems) {
            await client.query(
                `INSERT INTO chi_tiet_don_hang (don_hang_id, bien_the_id, ten_san_pham, gia, so_luong)
                 VALUES ($1, $2, $3, $4, $5)`,
                [orderId, item.bien_the_id, item.ten_san_pham, item.finalPrice, item.so_luong]
            );

            const stockUpdateRes = await client.query(
                `UPDATE ton_kho SET so_luong_ton = so_luong_ton - $1 WHERE bien_the_id = $2 RETURNING so_luong_ton`,
                [item.so_luong, item.bien_the_id]
            );
            
            await client.query(
                `INSERT INTO lich_su_ton_kho (bien_the_id, so_luong_thay_doi, so_luong_sau_khi_doi, loai_giao_dich, tham_chieu_id, ghi_chu, nguoi_thuc_hien)
                 VALUES ($1, $2, $3, 'xuat_ban', $4, 'Hệ thống tự động trừ kho khi khách đặt hàng', $5)`,
                [item.bien_the_id, -item.so_luong, stockUpdateRes.rows[0].so_luong_ton, orderId, userId]
            );
        }

        if (voucherId) {
            await client.query(`UPDATE phieu_giam_gia SET da_dung = da_dung + 1 WHERE phieu_giam_gia_id = $1`, [voucherId]);
            await client.query(
                `INSERT INTO nguoi_dung_phieu_giam_gia (phieu_giam_gia_id, nguoi_dung_id, so_lan_su_dung)
                 VALUES ($1, $2, 1)
                 ON CONFLICT (phieu_giam_gia_id, nguoi_dung_id) DO UPDATE SET so_lan_su_dung = nguoi_dung_phieu_giam_gia.so_lan_su_dung + 1`,
                [voucherId, userId]
            );
        }

        const paymentMethod = payload.phuong_thuc_thanh_toan === 'MOMO' ? 'MOMO' : 'COD';
        await client.query(`INSERT INTO thanh_toan (don_hang_id, phuong_thuc, trang_thai) VALUES ($1, $2, 'pending')`, [orderId, paymentMethod]);
        await client.query(`INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES ($1, 'pending')`, [orderId]);
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

const createBuyNowOrder = async (userId, payload) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { variant_id, quantity } = payload.buy_now_item;
        if (!variant_id || !quantity || quantity <= 0) {
            throw { statusCode: 400, message: 'Sản phẩm mua ngay không hợp lệ' };
        }

        const itemRes = await client.query(`
            SELECT bt.bien_the_id, bt.gia, sp.ten_san_pham, sp.loai_san_pham_id, tk.so_luong_ton,
                   (SELECT row_to_json(d) FROM (
                        SELECT km.kieu_giam_gia AS type, km.gia_tri AS value
                        FROM khuyen_mai_san_pham kmsp
                        JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
                        WHERE kmsp.san_pham_id = sp.san_pham_id
                          AND km.trang_thai = 'active'
                          AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= CURRENT_TIMESTAMP)
                          AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= CURRENT_TIMESTAMP)
                        ORDER BY km.khuyen_mai_id DESC
                        LIMIT 1
                    ) d) AS discount
            FROM bien_the_san_pham bt
            JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
            LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
            WHERE bt.bien_the_id = $1 
            FOR UPDATE OF bt
        `, [variant_id]);

        if (itemRes.rows.length === 0) throw { statusCode: 404, message: 'Sản phẩm hoặc Ca học không tồn tại' };
        const item = itemRes.rows[0];

        let shippingFee = 0;
        let finalShippingMethod = payload.shipping_method_id;
        let finalPhuongXaId = payload.phuong_xa_id;

        if (item.loai_san_pham_id === 3) {
            if (payload.phuong_thuc_thanh_toan === 'COD') {
                throw { statusCode: 400, message: 'Workshop bắt buộc phải thanh toán trước qua MOMO để giữ chỗ.' };
            }

            const wsStatusRes = await client.query(`SELECT trang_thai, ngay_bat_dau FROM hoi_thao_bien_the WHERE bien_the_id = $1`, [variant_id]);
            if (wsStatusRes.rows.length > 0) {
                const ws = wsStatusRes.rows[0];
                if (ws.trang_thai === 'closed' || ws.trang_thai === 'cancelled') {
                    throw { statusCode: 400, message: 'Ca học này đã đóng hoặc bị hủy.' };
                }
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const startDateString = new Date(ws.ngay_bat_dau);
                const startDate = new Date(startDateString.getFullYear(), startDateString.getMonth(), startDateString.getDate());
                
                if (today >= startDate) {
                    throw { statusCode: 400, message: 'Rất tiếc, ca học này đã bắt đầu hoặc đã kết thúc, không thể đăng ký.' };
                }
            }

            const capacityRes = await client.query(`
                SELECT COALESCE(SUM(ct.so_luong), 0)::int AS booked_slots
                FROM chi_tiet_don_hang ct 
                JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id 
                WHERE ct.bien_the_id = $1 AND dh.trang_thai != 'cancelled'
            `, [variant_id]);
            
            const bookedSlots = capacityRes.rows[0].booked_slots;
            const totalCapacity = Number(item.so_luong_ton || 0);

            if (bookedSlots + quantity > totalCapacity) {
                throw { statusCode: 400, message: 'Rất tiếc, ca học này đã hết chỗ hoặc không đủ số lượng vé bạn yêu cầu!' };
            }
            
            shippingFee = 0;
            finalShippingMethod = null;
            finalPhuongXaId = null;
        } else {
            if (Number(item.so_luong_ton) < quantity) {
                throw { statusCode: 400, message: `Sản phẩm "${item.ten_san_pham}" không đủ số lượng yêu cầu.` };
            }
            if (!payload.phuong_xa_id || !payload.shipping_method_id) {
                throw { statusCode: 400, message: 'Vui lòng cung cấp phương thức vận chuyển và địa chỉ để giao hàng' };
            }
            
            if (payload.shipping_method_id === 'GH_NHANH') {
                shippingFee = 32000;
            } else if (payload.shipping_method_id === 'GH_TIETKIEM') {
                shippingFee = 18000;
            } else {
                throw { statusCode: 400, message: 'Phương thức vận chuyển không hợp lệ' };
            }
        }

        let finalPrice = Number(item.gia);
        if (item.discount) {
            const discountValue = Number(item.discount.value);
            if (item.discount.type === 'percent') {
                finalPrice = finalPrice - (finalPrice * discountValue / 100);
            } else if (item.discount.type === 'fixed') {
                finalPrice = finalPrice - discountValue;
            }
            if (finalPrice < 0) finalPrice = 0;
        }
        const subTotal = finalPrice * quantity;

        let voucherId = null;
        let discountAmount = 0;

        if (payload.phieu_giam_gia_code) {
            const voucherRes = await client.query(
                `SELECT * FROM phieu_giam_gia WHERE ma = $1 FOR UPDATE`,
                [payload.phieu_giam_gia_code]
            );

            if (voucherRes.rows.length === 0) throw { statusCode: 404, message: 'Mã giảm giá không tồn tại' };
            const voucher = voucherRes.rows[0];

            if (voucher.so_luong !== null && voucher.da_dung >= voucher.so_luong) throw { statusCode: 400, message: 'Mã giảm giá đã hết lượt sử dụng' };
            const now = new Date();
            if (voucher.ngay_bat_dau && new Date(voucher.ngay_bat_dau) > now) throw { statusCode: 400, message: 'Mã giảm giá chưa đến thời gian áp dụng' };
            if (voucher.ngay_ket_thuc && new Date(voucher.ngay_ket_thuc) < now) throw { statusCode: 400, message: 'Mã giảm giá đã hết hạn' };
            if (voucher.gia_tri_toi_thieu !== null && subTotal < Number(voucher.gia_tri_toi_thieu)) throw { statusCode: 400, message: `Đơn hàng chưa đạt giá trị tối thiểu` };

            const usageRes = await client.query(
                `SELECT so_lan_su_dung FROM nguoi_dung_phieu_giam_gia WHERE nguoi_dung_id = $1 AND phieu_giam_gia_id = $2`,
                [userId, voucher.phieu_giam_gia_id]
            );
            if (usageRes.rows.length > 0 && usageRes.rows[0].so_lan_su_dung > 0) throw { statusCode: 400, message: 'Bạn đã sử dụng mã giảm giá này rồi' };

            if (voucher.kieu_giam_gia === 'fixed') {
                discountAmount = Number(voucher.gia_tri);
                if (discountAmount > subTotal) discountAmount = subTotal;
            } else if (voucher.kieu_giam_gia === 'percent') {
                discountAmount = (subTotal * Number(voucher.gia_tri)) / 100;
                if (voucher.giam_toi_da !== null && discountAmount > Number(voucher.giam_toi_da)) discountAmount = Number(voucher.giam_toi_da);
                if (discountAmount > subTotal) discountAmount = subTotal;
            } else if (voucher.kieu_giam_gia === 'free_ship') {
                if (item.loai_san_pham_id === 3) throw { statusCode: 400, message: 'Mã Freeship không áp dụng cho Workshop' };
                discountAmount = shippingFee; 
                if (voucher.giam_toi_da !== null && discountAmount > Number(voucher.giam_toi_da)) {
                    discountAmount = Number(voucher.giam_toi_da);
                }
            }
            voucherId = voucher.phieu_giam_gia_id;
        }

        const totalAmount = subTotal + shippingFee - discountAmount;
        const orderId = await generateOrderId(client);

        await client.query(
            `INSERT INTO don_hang (don_hang_id, nguoi_dung_id, tong_tien, phieu_giam_gia_id, so_tien_giam, phuong_xa_id, dia_chi_giao_hang, ten_nguoi_nhan, sdt_nguoi_nhan, trang_thai, phi_van_chuyen, phuong_thuc_giao_hang)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11)`,
            [
                orderId, userId, totalAmount, voucherId, discountAmount,
                finalPhuongXaId, payload.dia_chi_giao_hang, 
                payload.ten_nguoi_nhan, payload.sdt_nguoi_nhan,
                shippingFee, finalShippingMethod
            ]
        );

        await client.query(
            `INSERT INTO chi_tiet_don_hang (don_hang_id, bien_the_id, ten_san_pham, gia, so_luong)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, variant_id, item.ten_san_pham, finalPrice, quantity]
        );

        if (item.loai_san_pham_id !== 3) {
            const stockUpdateRes = await client.query(
                `UPDATE ton_kho SET so_luong_ton = so_luong_ton - $1 WHERE bien_the_id = $2 RETURNING so_luong_ton`,
                [quantity, variant_id]
            );
            await client.query(
                `INSERT INTO lich_su_ton_kho (bien_the_id, so_luong_thay_doi, so_luong_sau_khi_doi, loai_giao_dich, tham_chieu_id, ghi_chu, nguoi_thuc_hien)
                 VALUES ($1, $2, $3, 'xuat_ban', $4, 'Hệ thống tự động trừ kho (Chế độ Mua Ngay)', $5)`,
                [variant_id, -quantity, stockUpdateRes.rows[0].so_luong_ton, orderId, userId]
            );
        }

        if (voucherId) {
            await client.query(`UPDATE phieu_giam_gia SET da_dung = da_dung + 1 WHERE phieu_giam_gia_id = $1`, [voucherId]);
            await client.query(
                `INSERT INTO nguoi_dung_phieu_giam_gia (phieu_giam_gia_id, nguoi_dung_id, so_lan_su_dung)
                 VALUES ($1, $2, 1)
                 ON CONFLICT (phieu_giam_gia_id, nguoi_dung_id) DO UPDATE SET so_lan_su_dung = nguoi_dung_phieu_giam_gia.so_lan_su_dung + 1`,
                [voucherId, userId]
            );
        }

        const paymentMethod = payload.phuong_thuc_thanh_toan === 'MOMO' ? 'MOMO' : 'COD';
        await client.query(`INSERT INTO thanh_toan (don_hang_id, phuong_thuc, trang_thai) VALUES ($1, $2, 'pending')`, [orderId, paymentMethod]);
        await client.query(`INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES ($1, 'pending')`, [orderId]);

        await client.query('COMMIT');
        return { order_id: orderId, total_amount: totalAmount, payment_method: paymentMethod };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getUserOrders = async (userId, { page, limit, tab, type }) => {
    const offset = (page - 1) * limit;
    const params = [userId];
    let conditions = [];

    if (tab === 'history') {
        conditions.push(`trang_thai IN ('completed', 'cancelled')`);
    } else if (tab === 'ongoing') {
        conditions.push(`trang_thai NOT IN ('completed', 'cancelled')`);
    }

    if (type === 'workshop') {
        conditions.push(`EXISTS (
            SELECT 1 FROM chi_tiet_don_hang ct
            JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id
            JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
            WHERE ct.don_hang_id = don_hang.don_hang_id AND sp.loai_san_pham_id = 3
        )`);
    } else if (type === 'physical') {
        conditions.push(`EXISTS (
            SELECT 1 FROM chi_tiet_don_hang ct
            JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id
            JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
            WHERE ct.don_hang_id = don_hang.don_hang_id AND sp.loai_san_pham_id != 3
        )`);
    }

    const whereString = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
        `SELECT COUNT(*)::int AS total FROM don_hang WHERE nguoi_dung_id = $1 ${whereString}`, 
        params
    );
    const totalItems = countRes.rows[0].total;

    const ordersRes = await pool.query(
        `SELECT don_hang_id AS order_id, 
                trang_thai AS status, 
                tong_tien AS total_amount, 
                so_tien_giam AS discount_amount, 
                ten_nguoi_nhan AS customer_name, 
                dia_chi_giao_hang AS shipping_address,
                ngay_tao AS created_at
         FROM don_hang
         WHERE nguoi_dung_id = $1 ${whereString}
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
	const orderQuery = userId 
		? `SELECT don_hang_id AS order_id, nguoi_dung_id AS user_id, tong_tien AS total_amount, phieu_giam_gia_id AS voucher_id, so_tien_giam AS discount_amount, phi_van_chuyen AS shipping_fee, phuong_thuc_giao_hang AS shipping_method, phuong_xa_id AS ward_id, dia_chi_giao_hang AS shipping_address, ten_nguoi_nhan AS customer_name, sdt_nguoi_nhan AS phone_number, trang_thai AS status FROM don_hang WHERE don_hang_id = $1 AND nguoi_dung_id = $2`
		: `SELECT don_hang_id AS order_id, nguoi_dung_id AS user_id, tong_tien AS total_amount, phieu_giam_gia_id AS voucher_id, so_tien_giam AS discount_amount, phi_van_chuyen AS shipping_fee, phuong_thuc_giao_hang AS shipping_method, phuong_xa_id AS ward_id, dia_chi_giao_hang AS shipping_address, ten_nguoi_nhan AS customer_name, sdt_nguoi_nhan AS phone_number, trang_thai AS status FROM don_hang WHERE don_hang_id = $1`;
	const params = userId ? [orderId, userId] : [orderId];

	const orderRes = await pool.query(orderQuery, params);
	if (orderRes.rows.length === 0) return null;

	const order = orderRes.rows[0];

	const detailRes = await pool.query(
		`SELECT 
            ct.chi_tiet_don_hang_id AS item_id, 
            ct.bien_the_id AS variant_id, 
            ct.ten_san_pham AS product_name, 
            ct.gia AS price, 
            ct.so_luong AS quantity,
            bt.sku,
            bt.slug,
            bt.mau_sac AS color,
            bt.kich_co AS size,
            sp.san_pham_id AS product_id,
            sp.mo_ta AS description,
            c.ten_danh_muc AS category_name,
            pt.ten_loai AS type_name,
            (
                SELECT duong_dan_anh 
                FROM hinh_anh_bien_the 
                WHERE bien_the_id = ct.bien_the_id 
                ORDER BY thu_tu_hien_thi ASC 
                LIMIT 1
            ) AS image_url
         FROM chi_tiet_don_hang ct
         LEFT JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id
         LEFT JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
         LEFT JOIN danh_muc c ON sp.danh_muc_id = c.danh_muc_id
         LEFT JOIN loai_san_pham pt ON sp.loai_san_pham_id = pt.loai_san_pham_id
         WHERE ct.don_hang_id = $1`,
		[orderId]
	);

	// Lấy thông tin thanh toán
	const paymentRes = await pool.query(
		`SELECT phuong_thuc AS payment_method, trang_thai AS payment_status, ma_tham_chieu AS reference_code FROM thanh_toan WHERE don_hang_id = $1`,
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
		`SELECT don_hang_id AS order_id, 
                nguoi_dung_id AS user_id, 
                trang_thai AS status, 
                tong_tien AS total_amount, 
                ten_nguoi_nhan AS customer_name, 
                sdt_nguoi_nhan AS phone_number
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

        const checkRes = await client.query(
            `SELECT trang_thai FROM don_hang WHERE don_hang_id = $1 FOR UPDATE`, 
            [orderId]
        );

        if (checkRes.rows.length === 0) {
            throw { statusCode: 404, message: 'Đơn hàng không tồn tại' };
        }

        const currentStatus = checkRes.rows[0].trang_thai;

        if (currentStatus !== 'pending') {
            throw { 
                statusCode: 400, 
                message: `Đơn hàng đã qua khâu chờ duyệt (hiện đang: ${currentStatus}). Admin không được phép can thiệp.` 
            };
        }

        if (newStatus !== 'processing' && newStatus !== 'cancelled') {
            throw { 
                statusCode: 400, 
                message: 'Từ trạng thái chờ duyệt (pending), Admin chỉ được phép chuyển sang Đang xử lý (processing) hoặc Hủy đơn (cancelled).' 
            };
        }

		const result = await client.query(
			`UPDATE don_hang SET trang_thai = $1 WHERE don_hang_id = $2 RETURNING don_hang_id`,
			[newStatus, orderId]
		);

		await client.query(
			`INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES ($1, $2)`,
			[orderId, newStatus]
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
        `SELECT don_hang_id AS order_id, 
                nguoi_dung_id AS user_id, 
                trang_thai AS status, 
                tong_tien AS total_amount, 
                ten_nguoi_nhan AS customer_name, 
                sdt_nguoi_nhan AS phone_number
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
    createBuyNowOrder,
	getUserOrders,
	getOrderDetail,
	getAllOrdersAdmin,
	updateOrderStatus,
	filterOrdersAdmin,
};