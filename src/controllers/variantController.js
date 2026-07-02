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

const deleteVariant = async (req, res) => {
  try {
    const variantId = req.params.variant_id;
    await variantRepository.deleteVariant(variantId);
    res.status(200).json({
      success: true,
      message: "Xóa biến thể thành công",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa biến thể" });
  }
};

module.exports = {
  getAllVariantsStock,
  deleteVariant,
}
