const express = require('express');
const { requireAdmin, requireAuth } = require('../middlewares/authMiddleware');
const { 
  filterWorkshops, 
  getWorkshopDetail, 
  createWorkshop, 
  updateWorkshop, 
  deleteWorkshop,
  getMyWorkshops
} = require('../controllers/workshopController');

const router = express.Router();

/**
 * @swagger
 * /workshops/filter:
 *   post:
 *     summary: Lọc workshop theo nhiều tiêu chí
 *     tags: [Workshops]
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
router.post('/filter', filterWorkshops);

/**
 * @swagger
 * /workshops/{id}:
 *   get:
 *     summary: Lấy chi tiết workshop
 *     tags: [Workshops]
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
router.get('/:id', getWorkshopDetail);

/**
 * @swagger
 * /workshops:
 *   post:
 *     summary: Tạo workshop mới - ADMIN
 *     tags: [Workshops]
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
 *               description: "Hướng dẫn người mới đan khăn len..."
 *               location: "The Coffee House, Quận 1, TP.HCM"
 *               category_id: 7
 *               status: "active"
 *               sessions:
 *                 - session_name: "Ca Sáng (Thứ 7)"
 *                   price: 350000
 *                   total_capacity: 15
 *                   start_date: "2026-10-15"
 *                   start_time: "08:00:00"
 *                   end_time: "11:30:00"
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
 *     tags: [Workshops]
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
 *               sessions:
 *                 - variant_id: 10
 *                   session_name: "Ca Sáng (Thứ 7)"
 *                   price: 350000
 *                   total_capacity: 20
 *                   start_date: "2026-10-15"
 *                   start_time: "08:00:00"
 *                   end_time: "11:30:00"
 *                   status: "open"
 *                   images: []
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
 *     tags: [Workshops]
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

/**
 * @swagger
 * /workshops/my-workshops:
 *   get:
 *     summary: Lấy danh sách Workshop học viên đã mua
 *     tags: [Workshops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         description: Trạng thái (upcoming = Sắp diễn ra, ongoing = Đang diễn ra, past = Đã kết thúc)
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, past]
 *     responses:
 *       200:
 *         description: Lấy danh sách vé thành công
 */
router.get('/my-workshops', requireAuth, getMyWorkshops);

module.exports = router;