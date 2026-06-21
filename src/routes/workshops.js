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
 *     summary: Lọc workshop (Admin)
 *     tags:
 *       - Workshops
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/filter', requireAdmin, filterWorkshops);

/**
 * @swagger
 * /workshops/{id}:
 *   get:
 *     summary: Lấy chi tiết workshop (Admin)
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
 *         description: Success
 */
router.get('/:id', requireAdmin, getWorkshopDetail);

/**
 * @swagger
 * /workshops:
 *   post:
 *     summary: Tạo workshop (Admin)
 *     tags:
 *       - Workshops
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', requireAdmin, createWorkshop);

/**
 * @swagger
 * /workshops/{id}:
 *   put:
 *     summary: Cập nhật workshop (Admin)
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', requireAdmin, updateWorkshop);

/**
 * @swagger
 * /workshops/{id}:
 *   delete:
 *     summary: Xóa workshop (Admin)
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
 *         description: Deleted
 */
router.delete('/:id', requireAdmin, deleteWorkshop);

module.exports = router;