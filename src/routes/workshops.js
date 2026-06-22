const express = require('express');
const { requireAdmin } = require('../middlewares/authMiddleware');
const { 
  filterWorkshops, 
  getWorkshopDetail, 
  createWorkshop, 
  updateWorkshop, 
  deleteWorkshop 
} = require('../controllers/workshopController');

const router = express.Router();

/**
 * @swagger
 * /workshops/filter:
 *   post:
 *     summary: Lọc workshop theo nhiều tiêu chí - ADMIN
 *     tags:
 *       - Workshops
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               keyword: "Hà Nội"
 *               status: "active"
 *               page: 1
 *               limit: 10
 *     responses:
 *       200:
 *         description: Lọc thành công
 */
router.post('/filter', requireAdmin, filterWorkshops);

/**
 * @swagger
 * /workshops/{id}:
 *   get:
 *     summary: Lấy chi tiết workshop - ADMIN
 *     tags:
 *       - Workshops
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:id', requireAdmin, getWorkshopDetail);

/**
 * @swagger
 * /workshops:
 *   post:
 *     summary: Tạo workshop mới - ADMIN
 *     tags:
 *       - Workshops
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: "Workshop Đan Khăn Len Mùa Đông"
 *               description: "Hướng dẫn người mới..."
 *               location: "The Coffee House, Quận 1, TP.HCM"
 *               category_id: 7
 *               status: "active"
 *               sessions:
 *                 - session_name: "Ca Sáng (Thứ 7)"
 *                   price: 350000
 *                   capacity: 15
 *                   start_date: "2026-10-15T08:00:00Z"
 *                   end_date: "2026-10-15T11:30:00Z"
 *                   status: "open"
 *                   images: []
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', requireAdmin, createWorkshop);

/**
 * @swagger
 * /workshops/{id}:
 *   put:
 *     summary: Cập nhật thông tin workshop - ADMIN
 *     tags:
 *       - Workshops
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: "Workshop Đan Khăn Len Mùa Đông (Đã Cập Nhật)"
 *               description: "Thêm ưu đãi tặng len cho học viên."
 *               location: "The Coffee House, Quận 1, TP.HCM"
 *               category_id: 7
 *               status: "active"
 *               sessions: []
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', requireAdmin, updateWorkshop);

/**
 * @swagger
 * /workshops/{id}:
 *   delete:
 *     summary: Xóa workshop - ADMIN
 *     tags:
 *       - Workshops
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', requireAdmin, deleteWorkshop);

module.exports = router;