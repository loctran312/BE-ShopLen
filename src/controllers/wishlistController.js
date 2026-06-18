const wishlistRepository = require('../repositories/wishlistRepository');
const { parsePositiveInteger } = require('../utils/pagination');

const toggleWishlist = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu product_id' });
        }

        const action = await wishlistRepository.toggleWishlist(userId, product_id); // Đổi biến
        const message = action === 'added' ? 'Đã thêm vào danh sách yêu thích' : 'Đã gỡ khỏi danh sách yêu thích';

        return res.json({ success: true, message: message, action: action });
    } catch (error) {
        console.error('[WISHLIST] Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const getMyWishlist = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const page = parsePositiveInteger(req.query.page || 1, 'page');
        const limit = parsePositiveInteger(req.query.limit || 10, 'limit');

        const data = await wishlistRepository.getMyWishlist(userId, { page, limit });
        return res.json({ success: true, message: 'Lấy danh sách yêu thích thành công', data: data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

// API nội bộ / Admin để kích hoạt chạy ngầm quét email
const triggerEmailNotifications = async (req, res) => {
    try {
        const sentCount = await wishlistRepository.processPendingNotifications();
        return res.json({ success: true, message: `Đã quét và gửi thành công ${sentCount} email thông báo.` });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi khi quét thông báo' });
    }
};

module.exports = { toggleWishlist, getMyWishlist, triggerEmailNotifications };