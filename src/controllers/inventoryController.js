const inventoryRepository = require("../repositories/inventoryRepository");
const { parsePositiveInteger } = require('../utils/pagination');

const getInventoryOverview = async (req, res) => {
    try {
        const page = parsePositiveInteger(req.body.page || req.query.page || 1, 'page');
        const limit = parsePositiveInteger(req.body.limit || req.query.limit || 10, 'limit');
        
        const data = await inventoryRepository.getInventoryOverview({ 
            page, limit, 
            stock_status: req.body.stock_status || req.query.stock_status,
            keyword: req.body.keyword || req.query.keyword 
        });
        
        return res.status(200).json({ success: true, message: "Lấy báo cáo tồn kho thành công", data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

const getInventoryHistory = async (req, res) => {
    try {
        const variantId = parsePositiveInteger(req.params.variant_id, 'variant_id');
        
        const rawPage = req.query.page !== undefined 
            ? req.query.page 
            : (req.body && req.body.page !== undefined ? req.body.page : 1);
            
        const rawLimit = req.query.limit !== undefined 
            ? req.query.limit 
            : (req.body && req.body.limit !== undefined ? req.body.limit : 10);

        const page = parsePositiveInteger(rawPage, 'page');
        const limit = parsePositiveInteger(rawLimit, 'limit');

        const data = await inventoryRepository.getInventoryHistory(variantId, { page, limit });
        return res.status(200).json({ success: true, message: "Lấy lịch sử tồn kho thành công", data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const adjustInventory = async (req, res) => {
    try {
        const adminId = req.user.user_id; 

        const payloads = Array.isArray(req.body) ? req.body : [req.body];

        if (payloads.length === 0) {
            return res.status(400).json({ success: false, message: "Dữ liệu không được để trống" });
        }

        // Validate từng item trong mảng
        for (let i = 0; i < payloads.length; i++) {
            const item = payloads[i];
            if (!item.variant_id || item.quantity_change === undefined || !item.transaction_type) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Thiếu dữ liệu bắt buộc (variant_id, quantity_change, transaction_type) tại vị trí thứ ${i + 1}` 
                });
            }
        }

        const data = await inventoryRepository.adjustInventory(adminId, payloads);
        
        return res.status(200).json({ 
            success: true, 
            message: `Đã điều chỉnh thành công ${data.length} bản ghi tồn kho`, 
            data 
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Lỗi máy chủ" });
    }
};

module.exports = { getInventoryOverview, getInventoryHistory, adjustInventory };