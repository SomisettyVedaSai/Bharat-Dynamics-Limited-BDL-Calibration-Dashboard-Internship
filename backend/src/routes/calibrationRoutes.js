const express = require('express');
const router = express.Router();
const calibrationController = require('../controllers/calibrationController');

router.post('/with-inspection', calibrationController.createCalibration);
router.get('/recent', calibrationController.getRecentCalibrations);
router.get('/equipment/:id', calibrationController.getCalibrationsByEquipment);

module.exports = router;
