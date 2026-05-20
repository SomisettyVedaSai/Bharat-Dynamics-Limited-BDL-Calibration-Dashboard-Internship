const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');

router.post('/generate', certificateController.generateCertificateAndLabel);
router.get('/', certificateController.getCertificates);

module.exports = router;
