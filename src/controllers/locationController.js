const locationRepository = require('../repositories/locationRepository');

const getAllCities = async (req, res) => {
    try {
        const result = await locationRepository.getAllCities();
        res.json({
            success: true,
            message: 'Lấy danh sách tỉnh/thành thành công',
            data: {
                cities: result.rows,
            }
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Lỗi máy chủ',
		});
    }
};

const getWardsByCityCode = async (req, res) => {
    try {
		const cityCode = req.params.city_code;

		if (!cityCode || cityCode.trim() === '') {
			return res.status(400).json({
				success: false,
				message: 'Mã tỉnh/thành không được để trống',
			});
		}

		const result = await locationRepository.getWardsByCityCode(cityCode.trim());

		return res.json({
			success: true,
			message: 'Lấy danh sách phường/xã thành công',
			data: {
				wards: result.rows,
			},
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Lỗi máy chủ',
		});
	}
};

module.exports = {
    getAllCities,
    getWardsByCityCode
};