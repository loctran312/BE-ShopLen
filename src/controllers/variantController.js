const variantRepository = require("../repositories/variantRepository");
const { parsePositiveInteger } = require('../utils/pagination');

const getAllVariantsStock = async (req, res) => {
  try {
      const rawPage = req.query.page !== undefined
      ? req.query.page
      : (req.body && req.body.page !== undefined ? req.body.page : 1);

    const rawLimit = req.query.limit !== undefined
      ? req.query.limit
      : (req.body && req.body.limit !== undefined ? req.body.limit : 10);

    const page = parsePositiveInteger(rawPage, 'page');
    const limit = parsePositiveInteger(rawLimit, 'limit');
    const { variantsStock, pagination } = await variantRepository.getAllVariantsStock({ page, limit });
    return res.status(200).json({
      success: true,
      message: "Lấy tồn kho biến thể thành công",
      data: {
        variantsStock,
        pagination,
      },
    });
  } catch (error) {
    if (error.message && (error.message === 'page không hợp lệ' || error.message === 'limit không hợp lệ')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ message: error.message });
  }
}

const updateVariantStock = async (req, res) => {
  try {
    const variantId = req.params.variant_id;
    const { newStock } = req.body;
    await variantRepository.updateVariantStock(variantId, newStock);
    res.status(200).json({
      success: true,
      message: "Cập nhật tồn kho thành công",
      data: { variantId, newStock },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật tồn kho:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi cập nhật tồn kho" });
  }
};

const updateVariantStockChanges = async (req, res) => {
	try {
		const rawVariantId = req.params.variant_id;
		const variantId = Number(rawVariantId);

		if (!Number.isInteger(variantId) || variantId <= 0) {
			return res.status(400).json({
				success: false,
				message: 'variant_id không hợp lệ',
			});
		}

		const { stock_quantity, quantity_change } = req.body;

		// Gọi repository để xử lý Transaction cập nhật kho
		const newStock = await variantRepository.updateVariantStockChanges(variantId, {
			stock_quantity,
			quantity_change,
		});

		return res.json({
			success: true,
			message: 'Cập nhật tồn kho thành công',
			data: {
				variant_id: variantId,
				stock_quantity: newStock,
			},
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({
			success: false,
			message: error.message || 'Lỗi máy chủ',
		});
	}
};

const deleteVariant = async (req, res) => {
  try {
    const variantId = req.params.variant_id;
    await variantRepository.deleteVariant(variantId);
    res.status(200).json({
      success: true,
      message: "Xóa biến thể thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa biến thể:", error);
    res.status(500).json({ success: false, message: "Lỗi khi xóa biến thể" });
  }
};

module.exports = {
  getAllVariantsStock,
  updateVariantStock,
  updateVariantStockChanges,
  deleteVariant,
}
