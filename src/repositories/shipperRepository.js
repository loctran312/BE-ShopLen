const pool = require('../config/db');
const bcrypt = require('bcrypt');

// ---ADMIN ---

const getShippersList = async ({ page, limit, search, status, working_city_id }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;
    let whereClauses = ["nd.vai_tro = 'shipper'"];

    if (search) {
        whereClauses.push(`(nd.ten_dang_nhap ILIKE $${paramIndex} OR nd.so_dien_thoai ILIKE $${paramIndex} OR ts.ma_shipper ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
    }

    if (status) {
        whereClauses.push(`nd.trang_thai = $${paramIndex}`);
        params.push(status);
        paramIndex++;
    }

    if (working_city_id) {
        whereClauses.push(`ts.ma_tinh_hoat_dong = $${paramIndex}`);
        params.push(working_city_id);
        paramIndex++;
    }

    const whereString = `WHERE ${whereClauses.join(' AND ')}`;

    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM nguoi_dung nd JOIN thong_tin_shipper ts ON nd.nguoi_dung_id = ts.nguoi_dung_id ${whereString}`, params);
    const totalRecords = countRes.rows[0].total;

    const fetchParams = [...params, limit, offset];
    const query = `
        SELECT 
            ts.ma_shipper AS shipper_id,
            nd.ho || ' ' || nd.ten AS full_name,
            nd.so_dien_thoai AS phone,
            nd.trang_thai AS status,
            nd.ngay_tao AS created_at,
            ts.ma_tinh_hoat_dong AS working_city_id
        FROM nguoi_dung nd
        JOIN thong_tin_shipper ts ON nd.nguoi_dung_id = ts.nguoi_dung_id
        ${whereString}
        ORDER BY nd.ngay_tao DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const { rows } = await pool.query(query, fetchParams);

    return {
        shippers: rows,
        pagination: { current_page: page, limit, total_pages: Math.max(1, Math.ceil(totalRecords / limit)), total_records: totalRecords }
    };
};

const createShipperAccount = async (payload) => {
    const { full_name, phone, email, working_city_id } = payload;
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const nameParts = full_name.trim().split(' ');
        const ten = nameParts.pop();
        const ho = nameParts.join(' ');
        const defaultPassword = await bcrypt.hash('Password@123', 10);
        
        const idRes = await client.query("SELECT COALESCE(MAX(nguoi_dung_id), 0) + 1 AS new_id FROM nguoi_dung");
        const newUserId = idRes.rows[0].new_id;

        await client.query(
            `INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai, vai_tro, trang_thai)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'shipper', 'active')`,
            [newUserId, email, email.split('@')[0], defaultPassword, ho, ten, phone]
        );

        const maShipper = `SHP${String(newUserId).padStart(3, '0')}`;
        await client.query(
            `INSERT INTO thong_tin_shipper (nguoi_dung_id, ma_shipper, ma_tinh_hoat_dong) VALUES ($1, $2, $3)`,
            [newUserId, maShipper, working_city_id || null]
        );

        await client.query("COMMIT");
        return { shipper_id: maShipper, full_name, working_city_id, status: "ACTIVE" };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const updateShipperStatusByAdmin = async (shipperIdStr, status) => {
    const { rows } = await pool.query("SELECT nguoi_dung_id FROM thong_tin_shipper WHERE ma_shipper = $1", [shipperIdStr]);
    if (rows.length === 0) throw new Error("Shipper không tồn tại");

    await pool.query("UPDATE nguoi_dung SET trang_thai = $1 WHERE nguoi_dung_id = $2", [status.toLowerCase(), rows[0].nguoi_dung_id]);
};

const updateShipperWorkingCity = async (shipperId, newCityId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const res = await client.query(
            `UPDATE thong_tin_shipper SET ma_tinh_hoat_dong = $1 WHERE nguoi_dung_id = $2`,
            [newCityId, shipperId]
        );
        
        if (res.rowCount === 0) {
            const error = new Error('Không tìm thấy thông tin Shipper này');
            error.statusCode = 404;
            throw error;
        }
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// --- SHIPPER ---

const getShipperProfile = async (userId) => {
    const query = `
        SELECT 
            nd.nguoi_dung_id AS user_id,
            nd.ten_dang_nhap AS username,
            nd.ho AS first_name,
            nd.ten AS last_name,
            nd.thu_dien_tu AS email,
            nd.so_dien_thoai AS phone_number,
            nd.avatar,
            ts.ma_shipper AS shipper_code,
            ts.cccd,
            ts.bien_so_xe AS license_plate,
            ts.dia_chi_ca_nhan AS personal_address,
            ts.ma_tinh_hoat_dong AS working_city_id
        FROM nguoi_dung nd
        LEFT JOIN thong_tin_shipper ts ON nd.nguoi_dung_id = ts.nguoi_dung_id
        WHERE nd.nguoi_dung_id = $1 AND nd.vai_tro = 'shipper'
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
        const error = new Error('Không tìm thấy thông tin hồ sơ Shipper');
        error.statusCode = 404;
        throw error;
    }
    
    return result.rows[0];
};

const updateShipperProfile = async (userId, payload) => {
    const { full_name, phone, personal_address, avatar, cccd, license_plate } = payload;
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");

        if (full_name !== undefined || phone !== undefined || avatar !== undefined) {
            let ho, ten;
            if (full_name) {
                const nameParts = full_name.trim().split(' ');
                ten = nameParts.pop();
                ho = nameParts.join(' ');
            }

            await client.query(
                `UPDATE nguoi_dung 
                 SET ho = COALESCE($1, ho), 
                     ten = COALESCE($2, ten), 
                     so_dien_thoai = COALESCE($3, so_dien_thoai),
                     avatar = COALESCE($4, avatar)
                 WHERE nguoi_dung_id = $5`,
                [ho, ten, phone, avatar, userId]
            );
        }

        if (personal_address !== undefined || cccd !== undefined || license_plate !== undefined) {
            await client.query(
                `UPDATE thong_tin_shipper 
                 SET dia_chi_ca_nhan = COALESCE($1, dia_chi_ca_nhan),
                     cccd = COALESCE($2, cccd),
                     bien_so_xe = COALESCE($3, bien_so_xe)
                 WHERE nguoi_dung_id = $4`,
                [personal_address, cccd, license_plate, userId]
            );
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const getAvailableOrdersForShipper = async (userId) => {
    const query = `
        SELECT 
            dh.don_hang_id AS order_id,
            'Kho tổng ShopLen, Quận 1' AS pickup_address,
            dh.dia_chi_giao_hang || ', ' || px.ten_phuong_xa || ', ' || tt.ten_tinh AS delivery_address,
            0 AS shipping_fee,
            CASE WHEN th.phuong_thuc = 'COD' THEN dh.tong_tien ELSE 0 END AS cod_amount,
            'READY_FOR_PICKUP' AS status
        FROM don_hang dh
        JOIN phuong_xa px ON dh.phuong_xa_id = px.phuong_xa_id
        JOIN tinh_thanh tt ON px.ma_tinh = tt.ma_tinh
        LEFT JOIN thanh_toan th ON dh.don_hang_id = th.don_hang_id
        WHERE dh.trang_thai = 'processing' 
          AND px.ma_tinh = (
              SELECT ma_tinh_hoat_dong FROM thong_tin_shipper WHERE nguoi_dung_id = $1
          )
        ORDER BY dh.don_hang_id ASC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
};

const acceptOrder = async (shipperId, orderId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderRes = await client.query(
            `SELECT dh.tong_tien, th.phuong_thuc 
             FROM don_hang dh
             LEFT JOIN thanh_toan th ON dh.don_hang_id = th.don_hang_id
             WHERE dh.don_hang_id = $1 AND dh.trang_thai = 'processing' 
             FOR UPDATE OF dh`, 
            [orderId]
        );

        if (orderRes.rows.length === 0) {
            throw { statusCode: 400, message: 'Đơn hàng này không còn khả dụng hoặc đã có Shipper khác nhận.' };
        }

        const codAmount = orderRes.rows[0].phuong_thuc === 'COD' ? orderRes.rows[0].tong_tien : 0;

        await client.query(
            `UPDATE don_hang SET trang_thai = 'shipping', shipper_id = $1 WHERE don_hang_id = $2`,
            [shipperId, orderId]
        );

        await client.query(
            `INSERT INTO phan_cong_giao_hang (don_hang_id, shipper_id, trang_thai_giao, tien_thu_ho) 
             VALUES ($1, $2, 'accepted', $3)`,
            [orderId, shipperId, codAmount]
        );

        await client.query(`INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES ($1, 'shipping')`, [orderId]);

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateDeliveryStatus = async (shipperId, orderId, payload) => {
    const { status, proof_image, failed_reason } = payload;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const checkRes = await client.query(
            `SELECT trang_thai_giao, tien_thu_ho FROM phan_cong_giao_hang WHERE don_hang_id = $1 AND shipper_id = $2 FOR UPDATE`,
            [orderId, shipperId]
        );

        if (checkRes.rows.length === 0) {
            throw { statusCode: 403, message: 'Bạn không có quyền cập nhật đơn hàng này' };
        }

        if (status === 'success') {
            await client.query(
                `UPDATE phan_cong_giao_hang SET trang_thai_giao = 'delivered', hinh_anh_bang_chung = $1, ngay_hoan_thanh = CURRENT_TIMESTAMP WHERE don_hang_id = $2`,
                [proof_image || null, orderId]
            );

            await client.query(`UPDATE don_hang SET trang_thai = 'completed' WHERE don_hang_id = $1`, [orderId]);
            await client.query(`INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES ($1, 'completed')`, [orderId]);

            const codAmount = checkRes.rows[0].tien_thu_ho;
            if (Number(codAmount) > 0) {
                await client.query(`UPDATE thanh_toan SET trang_thai = 'paid' WHERE don_hang_id = $1`, [orderId]);
                await client.query(`UPDATE thong_tin_shipper SET tien_cod_dang_giu = tien_cod_dang_giu + $1 WHERE nguoi_dung_id = $2`, [codAmount, shipperId]);
            }

            await client.query(`
                INSERT INTO luot_quay (nguoi_dung_id, so_luot)
                SELECT nguoi_dung_id, 1 FROM don_hang WHERE don_hang_id = $1
                ON CONFLICT (nguoi_dung_id) 
                DO UPDATE SET so_luot = LEAST(luot_quay.so_luot + 1, 3)
            `, [orderId]);

        } else if (status === 'failed') {
            if (!failed_reason) throw { statusCode: 400, message: 'Vui lòng cung cấp lý do giao thất bại' };
            
            await client.query(
                `UPDATE phan_cong_giao_hang SET trang_thai_giao = 'failed', ly_do_that_bai = $1, hinh_anh_bang_chung = $2, ngay_hoan_thanh = CURRENT_TIMESTAMP WHERE don_hang_id = $3`,
                [failed_reason, proof_image || null, orderId]
            );

            await client.query(`UPDATE don_hang SET trang_thai = 'cancelled' WHERE don_hang_id = $1`, [orderId]);
            await client.query(`INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES ($1, 'cancelled')`, [orderId]);
        } else {
            throw { statusCode: 400, message: 'Trạng thái không hợp lệ (chỉ nhận success hoặc failed)' };
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getMyDeliveries = async (shipperId, statusFilter) => {
    let query = `
        SELECT 
            dh.don_hang_id AS order_id,
            dh.ten_nguoi_nhan AS customer_name,
            dh.sdt_nguoi_nhan AS customer_phone,
            dh.dia_chi_giao_hang || ', ' || px.ten_phuong_xa || ', ' || tt.ten_tinh AS delivery_address,
            pc.tien_thu_ho AS cod_amount,
            pc.trang_thai_giao AS delivery_status,
            pc.ngay_nhan_don AS accepted_at,
            pc.ngay_hoan_thanh AS completed_at
        FROM don_hang dh
        JOIN phan_cong_giao_hang pc ON dh.don_hang_id = pc.don_hang_id
        JOIN phuong_xa px ON dh.phuong_xa_id = px.phuong_xa_id
        JOIN tinh_thanh tt ON px.ma_tinh = tt.ma_tinh
        WHERE pc.shipper_id = $1
    `;
    const params = [shipperId];

    if (statusFilter) {
        query += ` AND pc.trang_thai_giao = $2`;
        params.push(statusFilter);
    }

    query += ` ORDER BY CASE WHEN pc.trang_thai_giao = 'accepted' THEN 1 ELSE 2 END, pc.ngay_nhan_don DESC`;
    
    const { rows } = await pool.query(query, params);
    return rows;
};

const getDeliveryDetail = async (shipperId, orderId) => {
    const orderQuery = `
        SELECT 
            dh.don_hang_id AS order_id,
            dh.ten_nguoi_nhan AS customer_name,
            dh.sdt_nguoi_nhan AS customer_phone,
            dh.dia_chi_giao_hang || ', ' || px.ten_phuong_xa || ', ' || tt.ten_tinh AS delivery_address,
            pc.tien_thu_ho AS cod_amount,
            th.phuong_thuc AS payment_method,
            pc.trang_thai_giao AS delivery_status,
            pc.ly_do_that_bai AS failed_reason,
            pc.hinh_anh_bang_chung AS proof_image,
            pc.ngay_nhan_don AS accepted_at,
            pc.ngay_hoan_thanh AS completed_at,
            dh.phi_van_chuyen AS shipping_fee,
            dh.tong_tien AS total_amount
        FROM don_hang dh
        JOIN phan_cong_giao_hang pc ON dh.don_hang_id = pc.don_hang_id
        JOIN phuong_xa px ON dh.phuong_xa_id = px.phuong_xa_id
        JOIN tinh_thanh tt ON px.ma_tinh = tt.ma_tinh
        LEFT JOIN thanh_toan th ON dh.don_hang_id = th.don_hang_id
        WHERE pc.shipper_id = $1 AND dh.don_hang_id = $2
    `;
    const orderRes = await pool.query(orderQuery, [shipperId, orderId]);
    if (orderRes.rows.length === 0) return null;
    
    const order = orderRes.rows[0];

    const itemsQuery = `
        SELECT 
            ct.ten_san_pham AS product_name,
            bt.mau_sac AS color,
            bt.kich_co AS size,
            ct.so_luong AS quantity,
            ct.gia AS price,
            (SELECT duong_dan_anh FROM hinh_anh_bien_the vi WHERE vi.bien_the_id = ct.bien_the_id ORDER BY vi.thu_tu_hien_thi ASC LIMIT 1) as image_url
        FROM chi_tiet_don_hang ct
        LEFT JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id
        WHERE ct.don_hang_id = $1
    `;
    const itemsRes = await pool.query(itemsQuery, [orderId]);
    order.items = itemsRes.rows;

    return order;
};

module.exports = {
    getShippersList, createShipperAccount, updateShipperStatusByAdmin, updateShipperWorkingCity,
    getShipperProfile, updateShipperProfile, getAvailableOrdersForShipper, acceptOrder, updateDeliveryStatus, getMyDeliveries, getDeliveryDetail
};  