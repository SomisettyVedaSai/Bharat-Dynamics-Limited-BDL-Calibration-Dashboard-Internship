const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

router.post('/factory', calendarController.addWorkingDay);
router.post('/factory/bulk-holidays', calendarController.bulkAddHolidays);
router.get('/', calendarController.getCalendar);
router.delete('/:id', calendarController.deleteCalendarDay);

module.exports = router;
