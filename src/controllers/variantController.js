const variantRepository = require("../repositories/variantRepository");

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
  updateVariantStock,
  updateVariantStockChanges,
  deleteVariant,
};
