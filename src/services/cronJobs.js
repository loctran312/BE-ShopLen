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
};
module.exports = initCronJobs;