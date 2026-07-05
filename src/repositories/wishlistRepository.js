const pool = require('../config/db');
const notificationService = require('../services/notificationService');

const toggleWishlist = async (userId, productId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const checkRes = await client.query(
            `SELECT danh_sach_yeu_thich_id FROM danh_sach_yeu_thich WHERE nguoi_dung_id = $1 AND san_pham_id = $2`,
            [userId, productId]
        );

        let action = '';
        if (checkRes.rows.length > 0) {
            await client.query(`DELETE FROM danh_sach_yeu_thich WHERE nguoi_dung_id = $1 AND san_pham_id = $2`, [userId, productId]);
            action = 'removed';
        } else {
            const insertRes = await client.query(
                `INSERT INTO danh_sach_yeu_thich (nguoi_dung_id, san_pham_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`, 
                [userId, productId]
            );
            action = insertRes.rows.length > 0 ? 'added' : 'already_added';
        }

        await client.query('COMMIT');
        return action === 'already_added' ? 'added' : action;
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
        `SELECT w.san_pham_id AS product_id, 
                ht.hoi_thao_id AS workshop_id,
                sp.ten_san_pham AS product_name, 
                sp.trang_thai_san_pham AS status,
                sp.loai_san_pham_id AS type_id,
                lsp.ten_loai AS type_name,
                (SELECT MIN(gia) FROM bien_the_san_pham WHERE san_pham_id = sp.san_pham_id) AS min_price,
                (SELECT duong_dan_anh FROM hinh_anh_bien_the vi 
                 JOIN bien_the_san_pham bt ON vi.bien_the_id = bt.bien_the_id 
                 WHERE bt.san_pham_id = sp.san_pham_id 
                 ORDER BY bt.bien_the_id ASC, vi.thu_tu_hien_thi ASC LIMIT 1) AS image_url,
                (SELECT row_to_json(d) FROM (
                    SELECT km.khuyen_mai_id AS voucher_id, km.tieu_de AS promotion_name, km.kieu_giam_gia AS type, km.gia_tri AS value
                    FROM khuyen_mai_san_pham kmsp
                    JOIN khuyen_mai km ON km.khuyen_mai_id = kmsp.khuyen_mai_id
                    WHERE kmsp.san_pham_id = sp.san_pham_id
                      AND km.trang_thai = 'active'
                      AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= CURRENT_TIMESTAMP)
                      AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= CURRENT_TIMESTAMP)
                    ORDER BY km.khuyen_mai_id DESC
                    LIMIT 1
                ) d) AS discount
         FROM danh_sach_yeu_thich w
         JOIN san_pham sp ON w.san_pham_id = sp.san_pham_id
         LEFT JOIN loai_san_pham lsp ON sp.loai_san_pham_id = lsp.loai_san_pham_id
         LEFT JOIN hoi_thao ht ON sp.san_pham_id = ht.san_pham_id
         WHERE w.nguoi_dung_id = $1
         ORDER BY w.danh_sach_yeu_thich_id DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );

    const processedItems = wishlistRes.rows.map(item => {
        const price = Number(item.min_price || 0);
        let finalPrice = price;
        let discount = item.discount || null;

        if (discount) {
            discount.value = Number(discount.value);
            if (discount.type === 'percent') {
                finalPrice = price - (price * discount.value / 100);
            } else if (discount.type === 'fixed') {
                finalPrice = price - discount.value;
            }
            if (finalPrice < 0) finalPrice = 0;
            
            item.discount = discount;
        } else {
            delete item.discount;
        }

        return {
            ...item,
            min_price: price,
            final_price: finalPrice
        };
    });

    return {
        items: processedItems,
        pagination: { total_items: totalItems, total_pages: Math.max(1, Math.ceil(totalItems / limit)), current_page: page, limit },
    };
};

const processPendingNotifications = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

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

            const isSent = await notificationService.sendNotificationEmail({
                destination: notif.thu_dien_tu,
                subject: subject,
                username: notif.ten_dang_nhap || 'Bạn',
                productName: notif.ten_san_pham,
                type: notif.loai_thong_bao
            });

            if (isSent) {
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