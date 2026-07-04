const workshopRepository = require('../repositories/workshopRepository');
const { parsePositiveInteger } = require('../utils/pagination');

const filterWorkshops = async (req, res) => {
    try {
        const { page = 1, limit = 10, keyword, status } = req.body;
        const result = await workshopRepository.filterWorkshopsAdmin({ page, limit, keyword, status });
        return res.json({ success: true, message: 'Lấy danh sách Workshop thành công', data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getWorkshopDetail = async (req, res) => {
    try {
        const workshop = await workshopRepository.getWorkshopDetail(req.params.id);
        if (!workshop) return res.status(404).json({ success: false, message: 'Workshop không tồn tại' });
        return res.json({ success: true, data: { workshop } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createWorkshop = async (req, res) => {
    try {
        const payload = req.body;
        if (!payload.title || !payload.location || !payload.category_id) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (title, location, category_id)' });
        }
        if (!Array.isArray(payload.sessions) || payload.sessions.length === 0) {
            return res.status(400).json({ success: false, message: 'Workshop phải có ít nhất 1 ca học (sessions)' });
        }

        const workshop = await workshopRepository.createWorkshop(payload);
        return res.status(201).json({ success: true, message: 'Tạo Workshop thành công', data: { workshop } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo Workshop' });
    }
};

const updateWorkshop = async (req, res) => {
    try {
        const id = parsePositiveInteger(req.params.id, 'id');
        const payload = req.body;

        const workshop = await workshopRepository.updateWorkshop(id, payload);
        return res.json({ success: true, message: 'Cập nhật Workshop thành công', data: { workshop } });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ khi cập nhật Workshop' });
    }
};

const deleteWorkshop = async (req, res) => {
    try {
        const id = parsePositiveInteger(req.params.id, 'id');
        await workshopRepository.deleteWorkshop(id);
        return res.json({ success: true, message: 'Xóa Workshop thành công' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ khi xóa Workshop' });
    }
};

module.exports = {
    filterWorkshops,
    getWorkshopDetail,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop
};