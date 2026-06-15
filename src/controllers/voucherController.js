const voucherRepository = require('../repositories/voucherRepository');
const { parsePositiveInteger } = require('../utils/pagination'); // Import util phân trang

// --- PUBLIC API ---
const getAvailableVouchers = async (req, res) => {
	try {
		const page = parsePositiveInteger(req.query.page || req.body.page || 1, 'page');
		const limit = parsePositiveInteger(req.query.limit || req.body.limit || 10, 'limit');

		const { vouchers, pagination } = await voucherRepository.getAvailableVouchers({ page, limit });

		return res.json({
			success: true,
			message: 'Lấy danh sách mã giảm giá thành công',
			data: { vouchers, pagination },
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
	}
};

const applyVoucher = async (req, res) => {
	try {
		const userId = req.user.user_id; // Lấy từ middleware verify token
		const code = req.body.code ? req.body.code.trim() : null;
		const orderValue = Number(req.body.order_value);

		if (!code) {
			return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
		}

		if (Number.isNaN(orderValue) || orderValue < 0) {
			return res.status(400).json({ success: false, message: 'Giá trị đơn hàng không hợp lệ' });
		}

		// Tìm mã giảm giá
		const voucherResult = await voucherRepository.getVoucherByCode(code);
		if (voucherResult.rows.length === 0) {
			return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
		}

		const voucher = voucherResult.rows[0];

		// Kiểm tra các điều kiện (Số lượng, Thời gian)
		if (voucher.quantity !== null && voucher.used_count >= voucher.quantity) {
			return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
		}

		const now = new Date();
		if (voucher.start_date && new Date(voucher.start_date) > now) {
			return res.status(400).json({ success: false, message: 'Mã giảm giá chưa đến thời gian bắt đầu' });
		}

		if (voucher.end_date && new Date(voucher.end_date) < now) {
			return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
		}

		// Kiểm tra điều kiện đơn hàng tối thiểu
		if (voucher.minimum_value !== null && orderValue < Number(voucher.minimum_value)) {
			return res.status(400).json({ 
				success: false, 
				message: `Đơn hàng phải từ ${Number(voucher.minimum_value).toLocaleString('vi-VN')}đ để áp dụng mã này` 
			});
		}

		// Kiểm tra xem user này đã dùng mã này chưa (Giả sử quy định mỗi người chỉ dùng 1 lần)
		const usageResult = await voucherRepository.getUserVoucherUsage(userId, voucher.voucher_id);
		if (usageResult.rows.length > 0 && usageResult.rows[0].so_lan_su_dung > 0) {
			return res.status(400).json({ success: false, message: 'Bạn đã sử dụng mã giảm giá này rồi' });
		}

		// Tính toán số tiền được giảm
		let discountAmount = 0;

		if (voucher.discount_type === 'fixed') {
			discountAmount = Number(voucher.value);
		} else if (voucher.discount_type === 'percent') {
			discountAmount = (orderValue * Number(voucher.value)) / 100;
			
			// Giới hạn số tiền giảm tối đa
			if (voucher.max_discount !== null && discountAmount > Number(voucher.max_discount)) {
				discountAmount = Number(voucher.max_discount);
			}
		}

		// Đảm bảo tiền giảm không lớn hơn tổng tiền đơn hàng
		if (discountAmount > orderValue) {
			discountAmount = orderValue;
		}

		const finalAmount = orderValue - discountAmount;

		return res.json({
			success: true,
			message: 'Áp dụng mã giảm giá thành công',
			data: {
				voucher_id: voucher.voucher_id,
				code: voucher.code,
				discount_type: voucher.discount_type,
				discount_amount: discountAmount,
				original_amount: orderValue,
				final_amount: finalAmount
			},
		});

	} catch (error) {
		console.error('[VOUCHER][APPLY] Error:', error);
		return res.status(500).json({
			success: false,
			message: 'Lỗi máy chủ khi áp dụng mã giảm giá',
		});
	}
};

// --- ADMIN API ---

const getAllVouchersAdmin = async (req, res) => {
	try {
		const page = parsePositiveInteger(req.query.page || req.body.page || 1, 'page');
		const limit = parsePositiveInteger(req.query.limit || req.body.limit || 10, 'limit');

		const { vouchers, pagination } = await voucherRepository.getAllVouchersAdmin({ page, limit });

		return res.json({
			success: true,
			message: 'Lấy danh sách tất cả voucher thành công',
			data: { vouchers, pagination },
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
	}
};

const getVoucherDetail = async (req, res) => {
	try {
		const id = parsePositiveInteger(req.params.id, 'id');
		const result = await voucherRepository.getVoucherById(id);

		if (result.rows.length === 0) {
			return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
		}

		return res.json({ success: true, data: { voucher: result.rows[0] } });
	} catch (error) {
		return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
	}
};

const createVoucher = async (req, res) => {
	try {
		const payload = req.body;
		if (!payload.code || !payload.discount_type || payload.value === undefined) {
			return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (code, discount_type, value)' });
		}

		const voucher = await voucherRepository.createVoucher(payload);
		return res.status(201).json({ success: true, message: 'Tạo voucher thành công', data: { voucher } });
	} catch (error) {
		if (error.code === '23505') {
			return res.status(400).json({ success: false, message: 'Mã code này đã tồn tại' });
		}
		return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
	}
};

const updateVoucher = async (req, res) => {
	try {
		const id = parsePositiveInteger(req.params.id, 'id');
		const current = await voucherRepository.getVoucherById(id);
		
		if (current.rows.length === 0) {
			return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
		}

		const voucher = await voucherRepository.updateVoucher(id, req.body);
		return res.json({ success: true, message: 'Cập nhật voucher thành công', data: { voucher } });
	} catch (error) {
		if (error.code === '23505') {
			return res.status(400).json({ success: false, message: 'Mã code này đã tồn tại' });
		}
		return res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
	}
};

const deleteVoucher = async (req, res) => {
	try {
		const id = parsePositiveInteger(req.params.id, 'id');
		const current = await voucherRepository.getVoucherById(id);
		
		if (current.rows.length === 0) {
			return res.status(404).json({ success: false, message: 'Voucher không tồn tại' });
		}

		await voucherRepository.deleteVoucher(id);
		return res.json({ success: true, message: 'Xóa voucher thành công' });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa' });
	}
};

module.exports = {
	getAvailableVouchers,
	applyVoucher,
	getAllVouchersAdmin,
	getVoucherDetail,
	createVoucher,
	updateVoucher,
	deleteVoucher
};