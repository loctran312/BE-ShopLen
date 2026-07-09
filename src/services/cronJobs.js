const pool = require('../config/db');
const cron = require('node-cron');

const initCronJobs = () => {
    cron.schedule('*/30 * * * *', async () => {
        await pool.query(`
            UPDATE don_hang 
            SET trang_thai = 'cancelled' 
            WHERE trang_thai = 'pending' 
              AND ngay_tao < NOW() - INTERVAL '15 minutes'
              AND don_hang_id IN (SELECT don_hang_id FROM thanh_toan WHERE phuong_thuc = 'MOMO')
        `);
        console.log('Cron Job: Đã dọn dẹp các đơn MoMo chưa thanh toán.');
    });

    cron.schedule('0 * * * *', async () => {
        await pool.query(`
            UPDATE hoi_thao_bien_the SET trang_thai = 'closed'
            WHERE trang_thai = 'open' 
              AND (ngay_bat_dau::date + gio_bat_dau) <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')
        `);

        await pool.query(`
            UPDATE san_pham SET trang_thai_san_pham = 'inactive'
            WHERE loai_san_pham_id = 3 AND trang_thai_san_pham = 'active'
              AND NOT EXISTS (
                  SELECT 1 FROM hoi_thao ht JOIN hoi_thao_bien_the htb ON ht.hoi_thao_id = htb.hoi_thao_id
                  WHERE ht.san_pham_id = san_pham.san_pham_id AND htb.trang_thai = 'open'
              )
        `);
        console.log('Cron Job: Đã dọn dẹp các Workshop hết hạn và đưa về Inactive.');
    });
};

module.exports = initCronJobs;