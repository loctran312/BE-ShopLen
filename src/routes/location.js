const express = require('express');
const {
    getAllCities,
    getWardsByCityCode
} = require('../controllers/locationController');

const router = express.Router();

router.get('/cities', getAllCities);
router.get('/cities/:city_code/wards', getWardsByCityCode);
module.exports = router;