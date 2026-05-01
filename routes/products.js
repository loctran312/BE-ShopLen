const express = require('express');
const { getAllProductTypes } = require('../controllers/productController');

const router = express.Router();

router.get('/types', getAllProductTypes);

module.exports = router;
