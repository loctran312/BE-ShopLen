const orderRepository = require('../repositories/orderRepository');
const cartRepository = require('../repositories/cartRepository');
const momoService = require('../services/momoService');
const { parsePositiveInteger } = require('../utils/pagination');

// --- PUBLIC ---

const createOrder = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { phuong_xa_id, dia_chi_giao_hang, ten_nguoi_nhan, sdt_nguoi_nhan } = req.body;

		// Validate cơ bản
		if (!phuong_xa_id || !dia_chi_giao_hang || !ten_nguoi_nhan || !sdt_nguoi_nhan) {
			return res.status(400).json({ 
				success: false, 
				message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng (Phường/xã, địa chỉ, tên, sđt)' 
			});
		}

		// Gọi hàm tạo order phức tạp ở Repository
		const result = await orderRepository.createOrder(userId, req.body);

		let payUrl = null;

        // Nếu khách chọn thanh toán MOMO, tiến hành tạo link thanh toán
        if (result.payment_method === 'MOMO') {
            const momoResponse = await momoService.createPaymentUrl(
                result.order_id, 
                result.total_amount, 
                `Thanh toan don hang ${result.order_id} tai ShopLen`
            );
            payUrl = momoResponse.payUrl;
			console.log('--- [MOMO RESPONSE] ---', momoResponse);
        }

        return res.status(201).json({
            success: true,
            message: result.payment_method === 'MOMO' ? 'Vui lòng thanh toán để hoàn tất đơn hàng' : 'Đặt hàng thành công',
            data: {
                ...result,
                payUrl: payUrl
            }
        });

	} catch (error) {
		// Bắt lỗi do kho hết hàng, mã giảm giá sai... ném ra từ Repository
		if (error.statusCode) {
			return res.status(error.statusCode).json({ success: false, message: error.message });
		}
		console.error('[ORDER][CREATE] Error:', error);
		return res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ khi tạo đơn hàng' });
	}
};

const getMyOrders = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const page = parsePositiveInteger(req.query.page || 1, 'page');
		const limit = parsePositiveInteger(req.query.limit || 10, 'limit');

		const { orders, pagination } = await orderRepository.getUserOrders(userId, { page, limit });

		return res.json({
			success: true,
			message: 'Lấy lịch sử đơn hàng thành công',
			data: { orders, pagination }
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ success: false, message: error.message });
	}
};

const getMyOrderDetail = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const orderId = req.params.id;

		const order = await orderRepository.getOrderDetail(orderId, userId);

		if (!order) {
			return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu' });
		}

		return res.json({ success: true, data: { order } });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
	}
};

const repurchaseOrder = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const orderId = req.params.id;

		// Lấy chi tiết đơn hàng cũ
		const order = await orderRepository.getOrderDetail(orderId, userId);

		if (!order) {
			return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu' });
		}

		const itemsToAdd = order.items;
		if (!itemsToAdd || itemsToAdd.length === 0) {
			return res.status(400).json({ success: false, message: 'Đơn hàng cũ không có sản phẩm nào' });
		}

		let addedCount = 0;
		let skippedCount = 0;

		// Lặp qua từng sản phẩm để thêm vào giỏ hàng
		for (const item of itemsToAdd) {
			const variantId = item.bien_the_id;
			const quantity = item.so_luong;

			// Bỏ qua nếu sản phẩm đã bị xóa khỏi hệ thống (do set null khóa ngoại)
			if (!variantId) {
				skippedCount++;
				continue;
			}

			// Kiểm tra tồn kho thực tế của biến thể đó
			const stockResult = await cartRepository.getVariantStock(variantId);
			if (stockResult.rows.length === 0) {
				skippedCount++;
				continue;
			}

			const stockQuantity = Number(stockResult.rows[0].stock_quantity);

			// Kiểm tra số lượng đã có sẵn trong giỏ hàng
			const currentCartItem = await cartRepository.getCartItem(userId, variantId);
			const currentQuantityInCart = currentCartItem.rows.length > 0 ? Number(currentCartItem.rows[0].so_luong) : 0;

			let qtyToAdd = quantity;
			// Nếu thêm số lượng cũ vào mà vượt quá tồn kho thì chỉ lấy số lượng tối đa có thể thêm
			if (currentQuantityInCart + qtyToAdd > stockQuantity) {
				qtyToAdd = Math.max(0, stockQuantity - currentQuantityInCart);
			}

			if (qtyToAdd > 0) {
				// Dùng lại hàm thêm vào giỏ hàng bạn đã viết trước đó
				await cartRepository.addItemToCart(userId, variantId, qtyToAdd);
				addedCount++;
			} else {
				skippedCount++;
			}
		}

		// Xử lý câu phản hồi cho Client
		if (addedCount === 0) {
			return res.status(400).json({ 
				success: false, 
				message: 'Tất cả sản phẩm trong đơn hàng này đã hết hàng hoặc giỏ hàng của bạn đã chứa tối đa số lượng.' 
			});
		}

		let message = `Đã thêm ${addedCount} sản phẩm vào giỏ hàng.`;
		if (skippedCount > 0) {
			message += ` (Bỏ qua ${skippedCount} sản phẩm do hết hàng hoặc không đủ tồn kho).`;
		}

		return res.json({
			success: true,
			message: message
		});

	} catch (error) {
		console.error('[ORDER][REPURCHASE] Error:', error);
		return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi mua lại đơn hàng' });
	}
};

// --- ADMIN ---

const getAllOrdersAdmin = async (req, res) => {
	try {
		// Lấy từ Query URL trước, nếu không có thì tìm trong Body, nếu vẫn không có thì mặc định là 1
		const rawPage = req.query.page !== undefined 
            ? req.query.page 
            : (req.body && req.body.page !== undefined ? req.body.page : 1);
            
		const rawLimit = req.query.limit !== undefined 
            ? req.query.limit 
            : (req.body && req.body.limit !== undefined ? req.body.limit : 10);

		const page = parsePositiveInteger(rawPage, 'page');
		const limit = parsePositiveInteger(rawLimit, 'limit');

		const { orders, pagination } = await orderRepository.getAllOrdersAdmin({ page, limit });

		return res.json({
			success: true,
			message: 'Lấy danh sách đơn hàng thành công',
			data: { orders, pagination }
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ success: false, message: error.message });
	}
};

const getOrderDetailAdmin = async (req, res) => {
	try {
		const orderId = req.params.id;
		const order = await orderRepository.getOrderDetail(orderId); // Không truyền userId để Admin xem tất cả

		if (!order) {
			return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
		}

		return res.json({ success: true, data: { order } });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
	}
};

const updateOrderStatus = async (req, res) => {
	try {
		const orderId = req.params.id;
		const { status } = req.body;

		const validStatuses = ['pending', 'processing', 'shipping', 'completed', 'cancelled'];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
		}

		const isUpdated = await orderRepository.updateOrderStatus(orderId, status);

		if (!isUpdated) {
			return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
		}

		return res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
	}
};

const filterOrdersAdmin = async (req, res) => {
    try {
        const page = parsePositiveInteger(req.body.page || 1, 'page');
        const limit = parsePositiveInteger(req.body.limit || 10, 'limit');
        
        const result = await orderRepository.filterOrdersAdmin({
            page, limit,
            keyword: req.body.keyword,
            statuses: req.body.statuses
        });

        return res.json({ success: true, message: 'Lọc đơn hàng thành công', data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

module.exports = {
	createOrder,
	getMyOrders,
	getMyOrderDetail,
	repurchaseOrder,
	getAllOrdersAdmin,
	getOrderDetailAdmin,
	updateOrderStatus,
	filterOrdersAdmin,
};