const promotionRepository = require('../repositories/promotionRepository');
const { parsePositiveInteger } = require('../utils/pagination');

// --- PUBLIC ---
const getActivePromotions = async (req, res) => {
	try {
		const page = parsePositiveInteger(req.query.page || 1, 'page');
		const limit = parsePositiveInteger(req.query.limit || 10, 'limit');

		const { promotions, pagination } = await promotionRepository.getActivePromotions({ page, limit });

		return res.json({
			success: true,
			message: 'Lấy danh sách khuyến mãi khả dụng thành công',
			data: { promotions, pagination },
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ success: false, message: error.message });
	}
};

const getPromotionDetail = async (req, res) => {
	try {
		const id = parsePositiveInteger(req.params.id, 'id');
		const promotion = await promotionRepository.getPromotionById(id);

		if (!promotion) {
			return res.status(404).json({ success: false, message: 'Khuyến mãi không tồn tại' });
		}

		return res.json({ success: true, data: { promotion } });
	} catch (error) {
		return res.status(error.statusCode || 500).json({ success: false, message: error.message });
	}
};

// --- ADMIN ---
const getAllPromotionsAdmin = async (req, res) => {
	try {
		const page = parsePositiveInteger(req.query.page || 1, 'page');
		const limit = parsePositiveInteger(req.query.limit || 10, 'limit');

		const { promotions, pagination } = await promotionRepository.getAllPromotionsAdmin({ page, limit });

		return res.json({
			success: true,
			message: 'Lấy tất cả khuyến mãi thành công',
			data: { promotions, pagination },
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ success: false, message: error.message });
	}
};

const createPromotion = async (req, res) => {
	try {
		const payload = req.body;
		if (!payload.title || !payload.value) {
			return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (title, value)' });
		}

		const promotion = await promotionRepository.createPromotion(payload);
		return res.status(201).json({ success: true, message: 'Tạo khuyến mãi thành công', data: { promotion } });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ khi tạo khuyến mãi' });
	}
};

const updatePromotion = async (req, res) => {
    try {
        const id = parsePositiveInteger(req.params.id, 'id');
        const current = await promotionRepository.getPromotionById(id);
        
        if (!current) {
            return res.status(404).json({ success: false, message: 'Khuyến mãi không tồn tại' });
        }

        const now = new Date();
        const isStarted = !current.start_date || new Date(current.start_date) <= now;
        const isEnded = current.end_date && new Date(current.end_date) <= now;

        if (isEnded) {
            return res.status(400).json({ 
                success: false, 
                message: "Không thể chỉnh sửa chương trình khuyến mãi đã kết thúc." 
            });
        }

        let updatePayload = req.body;

        if (isStarted) {
            updatePayload = {
                title: current.title,
                discount_type: current.discount_type,
                value: current.value,
                min_order_value: current.min_order_value,
                start_date: current.start_date,
                end_date: current.end_date,
                status: current.status,
                applicable_products: req.body.applicable_products !== undefined 
                    ? req.body.applicable_products 
                    : current.applicable_products
            };
        }

        const promotion = await promotionRepository.updatePromotion(id, updatePayload);
        
        let message = 'Cập nhật khuyến mãi thành công';
        if (isStarted) {
            message = 'Cập nhật danh sách sản phẩm thành công. (Các thông tin khác bị khóa do chương trình đang chạy)';
        }

        return res.json({ success: true, message, data: { promotion } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

const deletePromotion = async (req, res) => {
	try {
		const id = parsePositiveInteger(req.params.id, 'id');
		const current = await promotionRepository.getPromotionById(id);
		
		if (!current) {
			return res.status(404).json({ success: false, message: 'Khuyến mãi không tồn tại' });
		}

		await promotionRepository.deletePromotion(id);
		return res.json({ success: true, message: 'Xóa khuyến mãi thành công' });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa' });
	}
};

const filterPromotionsAdmin = async (req, res) => {
    try {
        const page = parsePositiveInteger(req.body.page || 1, 'page');
        const limit = parsePositiveInteger(req.body.limit || 10, 'limit');
        
        const result = await promotionRepository.filterPromotionsAdmin({
            page, limit,
            keyword: req.body.keyword,
            discount_types: req.body.discount_types,
            statuses: req.body.statuses,
            sort_by: req.body.sort_by
        });

        return res.json({ success: true, message: 'Lọc khuyến mãi thành công', data: result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

module.exports = {
	getActivePromotions,
	getPromotionDetail,
	getAllPromotionsAdmin,
	createPromotion,
	updatePromotion,
	deletePromotion,
	filterPromotionsAdmin
};