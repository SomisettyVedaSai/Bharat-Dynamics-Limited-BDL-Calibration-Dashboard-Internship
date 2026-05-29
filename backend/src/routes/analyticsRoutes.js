const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/report', analyticsController.getMasterReport);
router.get('/report-pdf', analyticsController.getMasterReportPdf);

module.exports = router;
