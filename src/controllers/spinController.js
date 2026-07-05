const spinRepository = require('../repositories/spinRepository');
const { parsePositiveInteger } = require('../utils/pagination');

const getSpinInfo = async (req, res) => {
    try {
        const data = await spinRepository.getSpinInfo(req.user.user_id);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const playSpin = async (req, res) => {
    try {
        const result = await spinRepository.playSpin(req.user.user_id);
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

const getSpinHistory = async (req, res) => {
    try {
        const page = parsePositiveInteger(req.query.page || 1, 'page');
        const limit = parsePositiveInteger(req.query.limit || 10, 'limit');
        const data = await spinRepository.getSpinHistory(req.user.user_id, { page, limit });
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const getAdminConfigs = async (req, res) => {
    try {
        const data = await spinRepository.getAdminConfigs();
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const createAdminConfig = async (req, res) => {
    try {
        await spinRepository.createAdminConfig(req.body);
        return res.status(201).json({ success: true, message: 'Thêm phần thưởng thành công' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

const addTurnsToAllUsers = async (req, res) => {
    try {
        await spinRepository.addTurnsToAllUsers();
        return res.json({ success: true, message: 'Đã bơm 3 lượt quay cho toàn bộ người dùng' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const updateAdminConfig = async (req, res) => {
    try {
        const id = req.params.id;
        await spinRepository.updateAdminConfig(id, req.body);
        return res.json({ success: true, message: 'Cập nhật cấu hình phần thưởng thành công' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

module.exports = { getSpinInfo, playSpin, getSpinHistory, getAdminConfigs, createAdminConfig, addTurnsToAllUsers, updateAdminConfig };