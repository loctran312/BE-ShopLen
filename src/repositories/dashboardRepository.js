const pool = require('../config/db');

const calculateGrowth = (current, previous) => {
    const cur = Number(current) || 0;
    const prev = Number(previous) || 0;
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Number((((cur - prev) / prev) * 100).toFixed(2));
};

const generateLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
    }
    return dates;
};

const getDashboardMetrics = async () => {
    const vnTime = `(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')`;

    const [
        revenueRes, chartRes, topOrdersRes, ordersRes, 
        usersRes, inventoryRes, topProductsRes, workshopRes, 
        upcomingWsRes, topWsRes
    ] = await Promise.all([
        pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = ${vnTime}::date THEN tong_tien ELSE 0 END), 0) AS rev_today,
                COALESCE(SUM(CASE WHEN DATE_TRUNC('week', ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('week', ${vnTime}) THEN tong_tien ELSE 0 END), 0) AS rev_this_week,
                COALESCE(SUM(CASE WHEN DATE_TRUNC('week', ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('week', ${vnTime} - INTERVAL '1 week') THEN tong_tien ELSE 0 END), 0) AS rev_last_week,
                COALESCE(SUM(CASE WHEN DATE_TRUNC('month', ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('month', ${vnTime}) THEN tong_tien ELSE 0 END), 0) AS rev_this_month
            FROM don_hang WHERE trang_thai = 'completed'
        `),

        pool.query(`
            SELECT 
                TO_CHAR(DATE(ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS date,
                SUM(tong_tien)::int AS value
            FROM don_hang
            WHERE trang_thai = 'completed' 
              AND DATE(ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') >= ${vnTime}::date - INTERVAL '6 days'
            GROUP BY DATE(ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')
        `),

        pool.query(`
            SELECT don_hang_id AS order_id, ten_nguoi_nhan AS customer_name, tong_tien AS total_amount
            FROM don_hang
            WHERE trang_thai = 'completed' AND DATE(ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = ${vnTime}::date
            ORDER BY tong_tien DESC LIMIT 5
        `),

        pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE trang_thai = 'pending')::int AS pending,
                COUNT(*) FILTER (WHERE trang_thai = 'processing')::int AS processing,
                COUNT(*) FILTER (WHERE trang_thai = 'shipping')::int AS shipping,
                COUNT(*) FILTER (WHERE trang_thai = 'completed')::int AS completed,
                COUNT(*) FILTER (WHERE DATE_TRUNC('week', ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('week', ${vnTime}))::int AS orders_this_week,
                COUNT(*) FILTER (WHERE DATE_TRUNC('week', ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('week', ${vnTime} - INTERVAL '1 week'))::int AS orders_last_week
            FROM don_hang
        `),

        pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE vai_tro = 'customer' AND trang_thai = 'active')::int AS active_customers,
                COUNT(*) FILTER (WHERE vai_tro = 'shipper' AND trang_thai = 'active')::int AS active_shippers,
                COUNT(*) FILTER (WHERE vai_tro = 'customer' AND DATE_TRUNC('month', ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('month', ${vnTime}))::int AS new_this_month
            FROM nguoi_dung
        `),

        pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE so_luong_ton = 0)::int AS out_of_stock,
                COUNT(*) FILTER (WHERE so_luong_ton > 0 AND so_luong_ton <= 20)::int AS low_stock
            FROM ton_kho
        `),

        pool.query(`
            SELECT sp.ten_san_pham AS product_name, SUM(ct.so_luong)::int AS total_sold
            FROM chi_tiet_don_hang ct 
            JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id 
            JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id 
            JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
            WHERE sp.loai_san_pham_id != 3 AND dh.trang_thai = 'completed'
            GROUP BY sp.san_pham_id, sp.ten_san_pham 
            ORDER BY total_sold DESC 
            LIMIT 10
        `),

        pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN DATE(dh.ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = ${vnTime}::date THEN ct.so_luong ELSE 0 END), 0)::int AS bookings_today,
                COALESCE(SUM(CASE WHEN DATE_TRUNC('week', dh.ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('week', ${vnTime}) THEN ct.so_luong ELSE 0 END), 0)::int AS bookings_this_week,
                COALESCE(SUM(CASE WHEN DATE_TRUNC('week', dh.ngay_tao AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = DATE_TRUNC('week', ${vnTime} - INTERVAL '1 week') THEN ct.so_luong ELSE 0 END), 0)::int AS bookings_last_week
            FROM chi_tiet_don_hang ct JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
            WHERE sp.loai_san_pham_id = 3 AND dh.trang_thai = 'completed'
        `),

        pool.query(`
            SELECT COUNT(*)::int AS upcoming_count FROM hoi_thao_bien_the 
            WHERE (ngay_bat_dau::date + gio_bat_dau) > ${vnTime} AND trang_thai != 'cancelled'
        `),

        pool.query(`
            SELECT sp.ten_san_pham AS title, SUM(ct.so_luong)::int AS total_bookings
            FROM chi_tiet_don_hang ct JOIN don_hang dh ON ct.don_hang_id = dh.don_hang_id JOIN bien_the_san_pham bt ON ct.bien_the_id = bt.bien_the_id JOIN san_pham sp ON bt.san_pham_id = sp.san_pham_id
            WHERE sp.loai_san_pham_id = 3 AND dh.trang_thai = 'completed'
            GROUP BY sp.san_pham_id, sp.ten_san_pham ORDER BY total_bookings DESC LIMIT 5
        `)
    ]);

    const last7Days = generateLast7Days();
    const chartData = last7Days.map(date => {
        const found = chartRes.rows.find(row => row.date === date);
        return { date, value: found ? found.value : 0 };
    });

    return {
        revenue: {
            today: Number(revenueRes.rows[0].rev_today),
            this_week: Number(revenueRes.rows[0].rev_this_week),
            this_month: Number(revenueRes.rows[0].rev_this_month),
            growth_vs_last_week: calculateGrowth(revenueRes.rows[0].rev_this_week, revenueRes.rows[0].rev_last_week)
        },
        revenue_chart: chartData,
        top_orders_today: topOrdersRes.rows,
        orders_count: {
            pending: ordersRes.rows[0].pending,
            processing: ordersRes.rows[0].processing,
            shipping: ordersRes.rows[0].shipping,
            completed: ordersRes.rows[0].completed,
            growth_vs_last_week: calculateGrowth(ordersRes.rows[0].orders_this_week, ordersRes.rows[0].orders_last_week)
        },
        workshop_stats: {
            bookings_today: workshopRes.rows[0].bookings_today,
            upcoming_count: upcomingWsRes.rows[0].upcoming_count,
            growth_vs_last_week: calculateGrowth(workshopRes.rows[0].bookings_this_week, workshopRes.rows[0].bookings_last_week),
            top_workshops: topWsRes.rows
        },
        users: usersRes.rows[0],
        inventory_alerts: inventoryRes.rows[0],
        top_selling_products: topProductsRes.rows
    };
};

module.exports = { getDashboardMetrics };