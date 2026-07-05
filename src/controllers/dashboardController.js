const dashboardRepository = require('../repositories/dashboardRepository');

const getDashboardInfo = async (req, res) => {
    try {
        const metrics = await dashboardRepository.getDashboardMetrics();
        return res.status(200).json({ 
            success: true, 
            message: 'Lấy dữ liệu tổng quan Dashboard thành công',
            data: metrics
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi máy chủ khi tải Dashboard: ' + error.message 
        });
    }
};

module.exports = { getDashboardInfo };