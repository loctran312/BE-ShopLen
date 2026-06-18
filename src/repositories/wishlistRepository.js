const pool = require('../config/db');
const notificationService = require('../services/notificationService');

// --- TÍNH NĂNG USER: CRUD WISHLIST ---
const toggleWishlist = async (userId, variantId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Kiểm tra xem đã có trong wishlist chưa
        const checkRes = await client.query(
            `SELECT danh_sach_yeu_thich_id FROM danh_sach_yeu_thich WHERE nguoi_dung_id = $1 AND bien_the_id = $2`,
            [userId, variantId]
        );

        let action = '';
        if (checkRes.rows.length > 0) {
            // Nếu có rồi -> Bỏ thích
            await client.query(`DELETE FROM danh_sach_yeu_thich WHERE nguoi_dung_id = $1 AND bien_the_id = $2`, [userId, variantId]);
            action = 'removed';
        } else {
            // Nếu chưa có -> Thêm yêu thích
            await client.query(`INSERT INTO danh_sach_yeu_thich (nguoi_dung_id, bien_the_id) VALUES ($1, $2)`, [userId, variantId]);
            action = 'added';
        }

        await client.query('COMMIT');
        return action;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getMyWishlist = async (userId, { page, limit }) => {
    const offset = (page - 1) * limit;

    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM danh_sach_yeu_thich WHERE nguoi_dung_id = $1', [userId]);
    const totalItems = countRes.rows[0].total;

    if (totalItems === 0) return { items: [], pagination: { total_items: 0, total_pages: 1, current_page: page, limit } };

    const wishlistRes = await pool.query(
        `SELECT w.bien_the_id AS variant_id, sp.ten_san_pham AS product_name, bt.mau_sac AS color, bt.gia AS price, bt.slug,
                COALESCE(tk.so_luong_ton, 0) AS stock_quantity,
                (SELECT duong_dan_anh FROM hinh_anh_bien_the vi WHERE vi.bien_the_id = bt.bien_the_id ORDER BY thu_tu_hien_thi ASC LIMIT 1) AS image_url
         FROM danh_sach_yeu_thich w
         JOIN bien_the_san_pham bt ON w.bien_the_id = bt.bien_the_id
         JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
         LEFT JOIN ton_kho tk ON bt.bien_the_id = tk.bien_the_id
         WHERE w.nguoi_dung_id = $1
         ORDER BY w.danh_sach_yeu_thich_id DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );

    return {
        items: wishlistRes.rows.map(item => ({...item, stock_quantity: Number(item.stock_quantity)})),
        pagination: { total_items: totalItems, total_pages: Math.max(1, Math.ceil(totalItems / limit)), current_page: page, limit },
    };
};

// --- TÍNH NĂNG HỆ THỐNG: QUÉT VÀ GỬI EMAIL THÔNG BÁO ---
const processPendingNotifications = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Lấy tối đa 50 thông báo chưa gửi để tránh quá tải API Resend
        const pendingRes = await client.query(
            `SELECT t.thong_bao_id, t.loai_thong_bao, nd.thu_dien_tu, nd.ten_dang_nhap, sp.ten_san_pham
             FROM thong_bao_yeu_thich t
             JOIN nguoi_dung nd ON t.nguoi_dung_id = nd.nguoi_dung_id
             JOIN san_pham sp ON t.san_pham_id = sp.san_pham_id
             WHERE t.da_gui = FALSE
             LIMIT 50 FOR UPDATE SKIP LOCKED`
        );

        let sentCount = 0;
        for (const notif of pendingRes.rows) {
            const subject = notif.loai_thong_bao === 'price_drop' ? '🔥 Cảnh báo Giảm giá từ ShopLen' : '📦 Sản phẩm yêu thích đã có hàng!';
            
            // Gọi qua Service gửi email bằng Resend
            const isSent = await notificationService.sendNotificationEmail({
                destination: notif.thu_dien_tu,
                subject: subject,
                username: notif.ten_dang_nhap || 'Bạn',
                productName: notif.ten_san_pham,
                type: notif.loai_thong_bao
            });

            if (isSent) {
                // Đánh dấu đã gửi
                await client.query(`UPDATE thong_bao_yeu_thich SET da_gui = TRUE WHERE thong_bao_id = $1`, [notif.thong_bao_id]);
                sentCount++;
            }
        }

        await client.query('COMMIT');
        return sentCount;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi processPendingNotifications:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    toggleWishlist,
    getMyWishlist,
    processPendingNotifications
};