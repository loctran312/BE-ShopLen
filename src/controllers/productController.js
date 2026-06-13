const productRepository = require('../repositories/productRepository');
const { parsePositiveInteger } = require('../utils/pagination');

const getAllProductTypes = async (req, res) => {
	try {
		const result = await productRepository.getAllProductTypes();
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: 'Lỗi máy chủ' });
	}
};

const getAllProducts = async (req, res) => {
	try {
		const rawPage = req.query.page !== undefined
			? req.query.page
			: (req.body && req.body.page !== undefined ? req.body.page : 1);

		const rawLimit = req.query.limit !== undefined
			? req.query.limit
			: (req.body && req.body.limit !== undefined ? req.body.limit : 10);

		const page = parsePositiveInteger(rawPage, 'page');
		const limit = parsePositiveInteger(rawLimit, 'limit');
		const { products, pagination } = await productRepository.getAllProducts({ page, limit });

		return res.json({
			success: true,
			message: 'Lấy danh sách sản phẩm thành công',
			data: {
				products,
				pagination,
			},
		});
	} catch (error) {
		if (error.message && (error.message === 'page không hợp lệ' || error.message === 'limit không hợp lệ')) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}

		return res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Lỗi máy chủ',
		});
	}
};

const getProductDetail = async (req, res) => {
	try {
		const productId = productRepository.parsePositiveInteger(req.params.product_id, 'product_id');
		const product = await productRepository.getProductDetail(productId);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Sản phẩm không tồn tại',
			});
		}

		return res.json({
			success: true,
			message: 'Lấy chi tiết sản phẩm thành công',
			data: {
				product,
			},
		});
	} catch (error) {
		if (error.message && error.message.endsWith('không hợp lệ')) {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}

		return res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Lỗi máy chủ',
		});
	}
};

const createProduct = async (req, res) => {
	try {
		const product = await productRepository.createProduct(req.body);

		return res.status(201).json({
			success: true,
			message: 'Tạo sản phẩm thành công',
			data: {
				product,
			},
		});
	} catch (error) {
		return res.status(error.statusCode || 400).json({
			success: false,
			message: error.message || 'Không thể tạo sản phẩm',
		});
	}
};

const updateProduct = async (req, res) => {
	try {
		const productId = productRepository.parsePositiveInteger(req.params.product_id, 'product_id');
		const product = await productRepository.updateProduct(productId, req.body);

		return res.json({
			success: true,
			message: 'Cập nhật sản phẩm thành công',
			data: {
				product,
			},
		});
	} catch (error) {
		return res.status(error.statusCode || 400).json({
			success: false,
			message: error.message || 'Không thể cập nhật sản phẩm',
		});
	}
};

const deleteProduct = async (req, res) => {
	try {
		const productId = productRepository.parsePositiveInteger(req.params.product_id, 'product_id');
		await productRepository.deleteProduct(productId);

		return res.json({
			success: true,
			message: 'Xóa sản phẩm thành công',
		});
	} catch (error) {
		return res.status(error.statusCode || 400).json({
			success: false,
			message: error.message || 'Không thể xóa sản phẩm',
		});
	}
};

module.exports = {
	getAllProductTypes,
	getAllProducts,
	getProductDetail,
	createProduct,
	updateProduct,
	deleteProduct,
};