const express = require('express');
const {
    getAllCities,
    getWardsByCityCode
} = require('../controllers/locationController');

const router = express.Router();

/**
 * @swagger
 * /location/cities:
 *   get:
 *     summary: Lấy danh sách tỉnh/thành phố
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/cities", getAllCities);

/**
 * @swagger
 * /location/cities/{city_code}/wards:
 *   get:
 *     summary: Lấy danh sách phường/xã theo mã tỉnh
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: city_code
 *         required: true
 *         schema:
 *           type: string
 *         example: "HCM"
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/cities/:city_code/wards", getWardsByCityCode);

module.exports = router;