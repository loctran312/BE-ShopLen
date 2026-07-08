const loyaltyRepository = require('../repositories/loyaltyRepository');
const { parsePositiveInteger } = require('../utils/pagination');

// ==========================================
// ADMIN
// ==========================================

const createReward = async (req, res) => {
    try {
        const { voucher_id, required_points } = req.body;

        if (!voucher_id || !required_points) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp voucher_id và required_points' });
        }
        if (required_points <= 0) {
            return res.status(400).json({ success: false, message: 'Số điểm yêu cầu phải lớn hơn 0' });
        }

        const data = await loyaltyRepository.createAdminReward(voucher_id, required_points);
        return res.status(201).json({ success: true, message: 'Tạo cấu hình đổi điểm thành công', data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

const deleteReward = async (req, res) => {
    try {
        const rewardId = req.params.id;
        await loyaltyRepository.deleteAdminReward(rewardId);
        return res.json({ success: true, message: 'Xóa gói đổi điểm thành công' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            message: error.message || 'Lỗi máy chủ khi xóa gói đổi điểm' 
        });
    }
};

const getAdminRewardsList = async (req, res) => {
    try {
        const page = parsePositiveInteger(req.query.page || 1, 'page');
        const limit = parsePositiveInteger(req.query.limit || 10, 'limit');

        const data = await loyaltyRepository.getAdminRewards({ page, limit });
        return res.status(200).json({ success: true, message: 'Lấy danh sách cấu hình thành công', data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

const toggleRewardStatus = async (req, res) => {
    try {
        const rewardId = req.params.id;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái chỉ chấp nhận 'active' hoặc 'inactive'" });
        }

        await loyaltyRepository.updateRewardStatus(rewardId, status);
        return res.status(200).json({ success: true, message: `Đã cập nhật trạng thái gói đổi điểm thành ${status}` });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

// ==========================================
// USER
// ==========================================

const getUserRewardsList = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await loyaltyRepository.getUserRewards(userId, { page, limit });
        
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getPointHistory = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const page = parsePositiveInteger(req.query.page || 1, 'page');
        const limit = parsePositiveInteger(req.query.limit || 10, 'limit');

        const data = await loyaltyRepository.getUserPointHistory(userId, { page, limit });
        return res.status(200).json({ success: true, message: 'Lấy lịch sử điểm thành công', data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

const redeemReward = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { reward_id } = req.body;

        if (!reward_id) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp reward_id' });
        }

        const data = await loyaltyRepository.redeemVoucher(userId, reward_id);
        return res.status(200).json({ success: true, message: 'Đổi điểm lấy Voucher thành công', data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

module.exports = {
    createReward,
    deleteReward,
    getAdminRewardsList,
    toggleRewardStatus,
    getUserRewardsList,
    getPointHistory,
    redeemReward
};