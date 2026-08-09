const dashboardRepository = require('../repositories/dashboardRepository');
const { parsePositiveInteger } = require('../utils/pagination');

const getDashboardInfo = async (req, res) => {
    try {
        const velocityLimit = req.query.velocity_limit
            ? parsePositiveInteger(req.query.velocity_limit, 'velocity_limit')
            : 20;

        const metrics = await dashboardRepository.getDashboardMetrics({ velocityLimit });
        return res.status(200).json({ 
            success: true, 
            message: 'Lấy dữ liệu tổng quan Dashboard thành công',
            data: metrics
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ 
            success: false, 
            message: 'Lỗi máy chủ khi tải Dashboard: ' + error.message 
        });
    }
};

module.exports = { getDashboardInfo };