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

router.post('/filter', requireAdmin, filterWorkshops);

router.get('/:id', requireAdmin, getWorkshopDetail);
router.post('/', requireAdmin, createWorkshop);
router.put('/:id', requireAdmin, updateWorkshop);
router.delete('/:id', requireAdmin, deleteWorkshop);

module.exports = router;