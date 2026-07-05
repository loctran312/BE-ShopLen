const variantRepository = require("../repositories/variantRepository");
const { parsePositiveInteger } = require('../utils/pagination');

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
  deleteVariant,
}
