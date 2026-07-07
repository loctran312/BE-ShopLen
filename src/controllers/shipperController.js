const shipperRepository = require("../repositories/shipperRepository");
const { parsePositiveInteger } = require('../utils/pagination');
const { uploadImageToImgBB } = require('../utils/imgbb');

// --- ADMIN API ---
const getShippers = async (req, res) => {
    try {
        const rawPage = req.query.page !== undefined ? req.query.page : (req.body && req.body.page !== undefined ? req.body.page : 1);
        const rawLimit = req.query.limit !== undefined ? req.query.limit : (req.body && req.body.limit !== undefined ? req.body.limit : 10);
        
        const search = req.query.search !== undefined ? req.query.search : (req.body && req.body.search);
        const status = req.query.status !== undefined ? req.query.status : (req.body && req.body.status);
        const working_city_id = req.query.working_city_id !== undefined ? req.query.working_city_id : (req.body && req.body.working_city_id);

        const page = parsePositiveInteger(rawPage, 'page');
        const limit = parsePositiveInteger(rawLimit, 'limit');
        
        const data = await shipperRepository.getShippersList({ 
            page, limit, 
            search, 
            status,
            working_city_id
        });
        
        return res.status(200).json({ 
            success: true, 
            message: "Lấy danh sách shipper thành công", 
            data: data.shippers, 
            pagination: data.pagination 
        });
    } catch (error) {
        if (error.message && (error.message === 'page không hợp lệ' || error.message === 'limit không hợp lệ')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: "Lỗi máy chủ: " + error.message });
    }
};

const createShipper = async (req, res) => {
    try {
        const { full_name, phone, email, working_city_id } = req.body;
        if (!full_name || !phone || !email || !working_city_id) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp đủ Họ tên, SĐT, Email và Thành phố hoạt động (working_city_id)" });
        }

        const data = await shipperRepository.createShipperAccount(req.body);
        return res.status(201).json({ success: true, message: "Tạo tài khoản shipper thành công. Mật khẩu mặc định là: Password@123", data });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ success: false, message: "Email hoặc SĐT đã tồn tại trong hệ thống" });
        return res.status(500).json({ success: false, message: "Lỗi máy chủ: " + error.message });
    }
};

const updateShipperStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['ACTIVE', 'INACTIVE'].includes(status?.toUpperCase())) {
            return res.status(400).json({ success: false, message: "Trạng thái chỉ được là ACTIVE hoặc INACTIVE" });
        }
        await shipperRepository.updateShipperStatusByAdmin(req.params.shipper_id, status.toLowerCase());
        return res.status(200).json({ success: true, message: "Cập nhật trạng thái tài khoản thành công" });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};

const updateShipperLocation = async (req, res) => {
    try {
        const shipperId = req.params.shipper_id;
        const { working_city_id } = req.body;

        if (!working_city_id || working_city_id.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: "Vui lòng cung cấp mã tỉnh/thành phố hoạt động (working_city_id)" 
            });
        }

        await shipperRepository.updateShipperWorkingCity(shipperId, working_city_id.trim());
        
        return res.status(200).json({ 
            success: true, 
            message: `Đã điều chuyển Shipper sang khu vực ${working_city_id.toUpperCase()} thành công` 
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            message: error.message || "Lỗi máy chủ" 
        });
    }
};

// --- SHIPPER API ---
const getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const profile = await shipperRepository.getShipperProfile(userId);
        
        return res.status(200).json({ 
            success: true, 
            message: "Lấy thông tin cá nhân Shipper thành công", 
            data: { profile }
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            message: error.message || "Lỗi máy chủ" 
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const payload = { ...req.body };

        if (payload.avatar && payload.avatar.startsWith('data:image')) {
            const resolvedUrl = await uploadImageToImgBB(payload.avatar, `shipper_${userId}_${Date.now()}`);
            payload.avatar = resolvedUrl;
        }

        await shipperRepository.updateShipperProfile(userId, payload);
        
        return res.status(200).json({ success: true, message: "Cập nhật thông tin cá nhân thành công" });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: "Số CCCD này đã tồn tại trong hệ thống." });
        }
        return res.status(500).json({ success: false, message: "Lỗi máy chủ: " + error.message });
    }
};

const getAvailableOrders = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        const data = await shipperRepository.getAvailableOrdersForShipper(userId);
        return res.status(200).json({ success: true, message: "Lấy danh sách đơn hàng phù hợp thành công", data });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi máy chủ: " + error.message });
    }
};

const acceptOrder = async (req, res) => {
    try {
        const shipperId = req.user.user_id;
        const orderId = req.params.order_id;

        await shipperRepository.acceptOrder(shipperId, orderId);
        
        return res.status(200).json({ 
            success: true, 
            message: "Nhận giao đơn hàng thành công! Trạng thái đơn đã chuyển sang Đang giao." 
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            message: error.message || "Lỗi máy chủ" 
        });
    }
};

const updateDeliveryStatus = async (req, res) => {
    try {
        const shipperId = req.user.user_id;
        const orderId = req.params.order_id;
        const payload = req.body;

        if (!payload.status) {
            return res.status(400).json({ success: false, message: 'Thiếu trạng thái giao hàng (status)' });
        }

        await shipperRepository.updateDeliveryStatus(shipperId, orderId, payload);
        
        return res.status(200).json({ 
            success: true, 
            message: payload.status === 'success' ? "Xác nhận giao hàng thành công!" : "Đã ghi nhận giao hàng thất bại."
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Lỗi máy chủ" });
    }
};

const getMyDeliveries = async (req, res) => {
    try {
        const shipperId = req.user.user_id;
        const status = req.query.status; // Truyền 'accepted' để lấy đơn đang giao
        
        const data = await shipperRepository.getMyDeliveries(shipperId, status);
        return res.status(200).json({ 
            success: true, 
            message: "Lấy danh sách công việc giao hàng thành công", 
            data: { deliveries: data }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi máy chủ: " + error.message });
    }
};

const getDeliveryDetail = async (req, res) => {
    try {
        const shipperId = req.user.user_id;
        const orderId = req.params.order_id;
        
        const order = await shipperRepository.getDeliveryDetail(shipperId, orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại hoặc bạn không được phân công giao đơn này." });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Lấy chi tiết đơn giao thành công", 
            data: { order } 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi máy chủ: " + error.message });
    }
};

module.exports = { getShippers, createShipper, updateShipperStatus, updateShipperLocation,
    getProfile, updateProfile, getAvailableOrders, acceptOrder, updateDeliveryStatus, getMyDeliveries, getDeliveryDetail };