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

const getProductsByCategory = async (req, res) => {
    try {
        const categoryId = productRepository.parsePositiveInteger(req.params.category_id, 'category_id');
        const page = productRepository.parsePositiveInteger(req.query.page || 1, 'page');
        const limit = productRepository.parsePositiveInteger(req.query.limit || 10, 'limit');

        const categoryIds = await productRepository.getCategoryDescendants(categoryId);

        if (!categoryIds || categoryIds.length === 0) {
             return res.json({ 
                 success: true, 
                 message: 'Không tìm thấy sản phẩm', 
                 data: { products: [], pagination: { total_items: 0, total_pages: 1, current_page: page, limit } } 
             });
        }

        const result = await productRepository.filterProducts({
            page, 
            limit,
            category_ids: categoryIds,
            status: 'active' 
        });

        return res.json({ success: true, message: 'Lấy sản phẩm theo danh mục thành công', data: result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
    }
};

const getTopSellingProducts = async (req, res) => {
    try {
        const limit = req.query.limit ? productRepository.parsePositiveInteger(req.query.limit, 'limit') : 10;
        const products = await productRepository.getTopSellingProducts(limit);
        
        return res.json({ success: true, message: 'Lấy top sản phẩm bán chạy thành công', data: { products } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy top sản phẩm' });
    }
};

const filterProducts = async (req, res) => {
    try {
        const page = productRepository.parsePositiveInteger(req.body.page || 1, 'page');
        const limit = productRepository.parsePositiveInteger(req.body.limit || 10, 'limit');
        
        const result = await productRepository.filterProducts({
            page, limit,
            keyword: req.body.keyword,
            category_ids: req.body.category_ids,
            type_ids: req.body.type_ids,
            min_price: req.body.min_price,
            max_price: req.body.max_price,
            status: req.body.status,
            sort_price: req.body.sort_price
        });

        return res.json({ success: true, message: 'Lọc sản phẩm thành công', data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lọc sản phẩm' });
    }
};

module.exports = {
	getAllProductTypes,
	getAllProducts,
	getProductDetail,
	createProduct,
	updateProduct,
	deleteProduct,
	getProductsByCategory,
	getTopSellingProducts,
	filterProducts,
};