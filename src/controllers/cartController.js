const cartRepository = require('../repositories/cartRepository');

const getCart = async (req, res) => {
	try {
		const userId = req.user.user_id; 
		const result = await cartRepository.getCartByUserId(userId);

		return res.json({
			success: true,
			message: 'Lấy danh sách giỏ hàng thành công',
			data: {
				cart: result.rows,
			},
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Lỗi máy chủ',
		});
	}
};

const addToCart = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const variantId = Number(req.body.variant_id);
		const quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : 1;

		if (!Number.isInteger(variantId) || variantId <= 0) {
			return res.status(400).json({ success: false, message: 'variant_id không hợp lệ' });
		}

		if (!Number.isInteger(quantity) || quantity <= 0) {
			return res.status(400).json({ success: false, message: 'Số lượng thêm phải là số nguyên dương' });
		}

		// Kiểm tra sản phẩm tồn tại và lấy số lượng tồn kho
		const stockResult = await cartRepository.getVariantStock(variantId);
		if (stockResult.rows.length === 0) {
			return res.status(404).json({ success: false, message: 'Biến thể sản phẩm không tồn tại' });
		}

		const stockQuantity = Number(stockResult.rows[0].stock_quantity);

		// Tính toán tổng số lượng nếu sản phẩm đã có sẵn trong giỏ
		const currentCartItem = await cartRepository.getCartItem(userId, variantId);
		const currentQuantityInCart = currentCartItem.rows.length > 0 ? Number(currentCartItem.rows[0].so_luong) : 0;

		if (currentQuantityInCart + quantity > stockQuantity) {
			return res.status(400).json({
				success: false,
				message: `Kho chỉ còn ${stockQuantity} sản phẩm. Trong giỏ hàng đã có ${currentQuantityInCart}, bạn không thể thêm ${quantity} sản phẩm nữa.`,
			});
		}

		// Thực hiện thêm vào giỏ hàng
		const result = await cartRepository.addItemToCart(userId, variantId, quantity);

		return res.status(200).json({
			success: true,
			message: 'Thêm sản phẩm vào giỏ hàng thành công',
			data: {
				item: result.rows[0],
			},
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Lỗi máy chủ',
		});
	}
};

const updateCartItem = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const variantId = Number(req.params.variant_id);
		const quantity = Number(req.body.quantity);

		if (!Number.isInteger(variantId) || variantId <= 0) {
			return res.status(400).json({ success: false, message: 'variant_id không hợp lệ' });
		}

		if (!Number.isInteger(quantity) || quantity <= 0) {
			return res.status(400).json({ success: false, message: 'Số lượng phải là số nguyên dương' });
		}

		// Kiểm tra số lượng tồn kho thực tế
		const stockResult = await cartRepository.getVariantStock(variantId);
		if (stockResult.rows.length === 0) {
			return res.status(404).json({ success: false, message: 'Biến thể sản phẩm không tồn tại' });
		}

		const stockQuantity = Number(stockResult.rows[0].stock_quantity);

		if (quantity > stockQuantity) {
			return res.status(400).json({
				success: false,
				message: `Không thể cập nhật số lượng. Số lượng yêu cầu vượt quá số lượng tồn kho (${stockQuantity}).`,
			});
		}

		// Kiểm tra xem sản phẩm thực sự có trong giỏ hàng chưa
		const currentCartItem = await cartRepository.getCartItem(userId, variantId);
		if (currentCartItem.rows.length === 0) {
			return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại trong giỏ hàng' });
		}

		// Cập nhật số lượng mới ghi đè
		const result = await cartRepository.updateItemQuantity(userId, variantId, quantity);

		return res.json({
			success: true,
			message: 'Cập nhật số lượng thành công',
			data: {
				item: result.rows[0],
			},
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Lỗi máy chủ',
		});
	}
};

const deleteCartItem = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const variantId = Number(req.params.variant_id);

		if (!Number.isInteger(variantId) || variantId <= 0) {
			return res.status(400).json({ success: false, message: 'variant_id không hợp lệ' });
		}

		const currentCartItem = await cartRepository.getCartItem(userId, variantId);
		if (currentCartItem.rows.length === 0) {
			return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng' });
		}

		await cartRepository.removeItemFromCart(userId, variantId);

		return res.json({
			success: true,
			message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Lỗi máy chủ',
		});
	}
};

const syncCart = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { local_cart } = req.body;

		// Kiểm tra payload đầu vào
		if (!Array.isArray(local_cart) || local_cart.length === 0) {
			return res.status(400).json({ 
                success: false, 
                message: 'Dữ liệu giỏ hàng local không hợp lệ hoặc trống' 
            });
		}

		// Lọc và ép kiểu dữ liệu để chống lỗi NaN hoặc âm
		const validItems = local_cart
			.filter(item => 
				Number.isInteger(Number(item.variant_id)) && Number(item.variant_id) > 0 &&
				Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0
			)
			.map(item => ({
				variant_id: Number(item.variant_id),
				quantity: Number(item.quantity)
			}));

		// Thực thi đồng bộ nếu có dữ liệu hợp lệ
		if (validItems.length > 0) {
			await cartRepository.syncLocalCart(userId, validItems);
		}

		// Lấy lại giỏ hàng mới nhất từ Database sau khi đã gộp xong
		const result = await cartRepository.getCartByUserId(userId);

		return res.status(200).json({
			success: true,
			message: 'Đồng bộ giỏ hàng thành công',
			data: {
				cart: result.rows,
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
	getCart,
	addToCart,
	updateCartItem,
	deleteCartItem,
    syncCart,
};