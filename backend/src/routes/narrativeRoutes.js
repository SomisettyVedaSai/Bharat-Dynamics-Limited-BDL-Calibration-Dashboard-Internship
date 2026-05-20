const express = require('express');
const router = express.Router();
const narrativeController = require('../controllers/narrativeController');

router.post('/', narrativeController.createNarrative);
router.get('/', narrativeController.getNarratives);
router.get('/:calibration_id', narrativeController.getNarrativeByCalibrationId);

module.exports = router;
