const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  syncCart,
} = require("../controllers/cartController");

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Lấy thông tin giỏ hàng
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/", getCart);

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variant_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/", addToCart);

/**
 * @swagger
 * /cart/sync:
 *   post:
 *     summary: Đồng bộ giỏ hàng dưới Local lên Server
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post("/sync", syncCart);

/**
 * @swagger
 * /cart/{variant_id}:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variant_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.put("/:variant_id", updateCartItem);

/**
 * @swagger
 * /cart/{variant_id}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variant_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.delete("/:variant_id", deleteCartItem);

module.exports = router;
