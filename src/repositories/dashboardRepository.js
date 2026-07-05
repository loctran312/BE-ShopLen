const pool = require('../config/db');

const getDashboardMetrics = async () => {
    const [revenueRes, ordersRes, usersRes, inventoryRes, topProductsRes] = await Promise.all([
        pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE THEN tong_tien ELSE 0 END), 0) AS today,
                COALESCE(SUM(CASE WHEN DATE_TRUNC('week', ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('week', CURRENT_DATE) THEN tong_tien ELSE 0 END), 0) AS this_week,
                COALESCE(SUM(CASE WHEN DATE_TRUNC('month', ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('month', CURRENT_DATE) THEN tong_tien ELSE 0 END), 0) AS this_month
            FROM don_hang 
            WHERE trang_thai = 'completed'
        `),

        pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE trang_thai = 'pending')::int AS pending,
                COUNT(*) FILTER (WHERE trang_thai = 'processing')::int AS processing,
                COUNT(*) FILTER (WHERE trang_thai = 'shipping')::int AS shipping,
                COUNT(*) FILTER (WHERE trang_thai = 'completed')::int AS completed,
                COUNT(*) FILTER (WHERE trang_thai = 'cancelled')::int AS cancelled
            FROM don_hang
        `),

        pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE vai_tro = 'customer' AND trang_thai = 'active')::int AS active_customers,
                COUNT(*) FILTER (WHERE vai_tro = 'shipper' AND trang_thai = 'active')::int AS active_shippers,
                COUNT(*) FILTER (
                    WHERE vai_tro = 'customer' 
                    AND DATE_TRUNC('month', ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('month', CURRENT_DATE)
                )::int AS new_this_month
            FROM nguoi_dung
        `),

        pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE so_luong_ton = 0)::int AS out_of_stock,
                COUNT(*) FILTER (WHERE so_luong_ton > 0 AND so_luong_ton <= 5)::int AS low_stock
            FROM ton_kho
        `),

        pool.query(`
            SELECT sp.ten_san_pham AS product_name, SUM(ct.so_luong)::int AS total_sold
            FROM chi_tiet_don_hang ct
            JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id
            JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id
            JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
            WHERE dh.trang_thai = 'completed'
            GROUP BY sp.san_pham_id, sp.ten_san_pham
            ORDER BY total_sold DESC
            LIMIT 5
        `)
    ]);

    return {
        revenue: {
            today: Number(revenueRes.rows[0].today),
            this_week: Number(revenueRes.rows[0].this_week),
            this_month: Number(revenueRes.rows[0].this_month)
        },
        orders_count: ordersRes.rows[0],
        users: usersRes.rows[0],
        inventory_alerts: inventoryRes.rows[0],
        top_selling_products: topProductsRes.rows
    };
};

module.exports = { getDashboardMetrics };