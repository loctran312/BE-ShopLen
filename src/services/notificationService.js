const { Resend } = require('resend');
const pool = require('../config/db');

const sanitizeFrom = (value) => (value || '').trim().replace(/^['"]|['"]$/g, '');
const sanitizeKey = (value) => (value || '').trim().split(/\s+/)[0];

const getResendApiKeys = () => {
    const primary = sanitizeKey(process.env.RESEND_API_KEY);
    const secondary = sanitizeKey(process.env.RESEND_API_KEY_1);
    return [primary, secondary].filter(Boolean);
};

const sendNotificationEmail = async ({ destination, subject, username, productName, type }) => {
    const apiKeys = getResendApiKeys();
    const from = sanitizeFrom(process.env.RESEND_FROM);

    let message = '';
    let htmlContent = '';

    // Phân loại nội dung email
    if (type === 'price_drop') {
        message = `Tin vui ${username} ơi! Sản phẩm ${productName} bạn đang quan tâm vừa GIẢM GIÁ. Mua ngay kẻo lỡ!`;
        htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #e74c3c;">🔥 BÁO ĐỘNG GIẢM GIÁ 🔥</h2>
                <p>Chào <strong>${username}</strong>,</p>
                <p>Sản phẩm <strong>${productName}</strong> nằm trong danh sách yêu thích của bạn vừa được giảm giá siêu hời!</p>
                <a href="http://localhost:5173/products" style="display: inline-block; padding: 10px 20px; background-color: #e74c3c; color: #fff; text-decoration: none; border-radius: 5px;">Xem Ngay</a>
            </div>
        `;
    } else if (type === 'back_in_stock') {
        message = `Tin vui ${username} ơi! Sản phẩm ${productName} đã CÓ HÀNG LẠI. Chốt đơn ngay thôi!`;
        htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #27ae60;">📦 ĐÃ CÓ HÀNG LẠI 📦</h2>
                <p>Chào <strong>${username}</strong>,</p>
                <p>Sản phẩm <strong>${productName}</strong> bạn đang săn lùng đã chính thức được restock (về hàng) trên ShopLen!</p>
                <a href="http://localhost:5173/products" style="display: inline-block; padding: 10px 20px; background-color: #27ae60; color: #fff; text-decoration: none; border-radius: 5px;">Mua Ngay</a>
            </div>
        `;
    }

    let lastError;
    for (let index = 0; index < apiKeys.length; index += 1) {
        const resend = new Resend(apiKeys[index]);
        try {
            await resend.emails.send({
                from,
                to: destination,
                subject: subject,
                text: message,
                html: htmlContent,
            });
            console.log(`[WISHLIST][EMAIL] Sent to ${destination} via Key ${index + 1}`);
            return true;
        } catch (error) {
            lastError = error;
            console.error(`[WISHLIST][EMAIL] Send failed with key ${index + 1}:`, error.message);
        }
    }
    console.error('Lỗi khi gửi email thông báo:', lastError);
    return false;
};

module.exports = {
    sendNotificationEmail
};