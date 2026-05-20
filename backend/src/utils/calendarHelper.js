const prisma = require('./db');

/**
 * Calculates due date = startDate + periodicity
 * @param {Date} startDate
 * @param {number} value  e.g. 365
 * @param {string} unit   'Days' | 'Months' | 'Years'
 * @returns {Date}
 */
function calculateDueDate(startDate, value, unit) {
  const d = new Date(startDate);
  const v = Number(value) || 365;
  if (unit === 'Months') d.setMonth(d.getMonth() + v);
  else if (unit === 'Years') d.setFullYear(d.getFullYear() + v);
  else d.setDate(d.getDate() + v); // default Days
  return d;
}

/**
 * Automatically shifts the date forward to the next working day if it falls on a holiday or Sunday.
 * @param {Date} date
 * @returns {Promise<Date>}
 */
async function getNextWorkingDay(date) {
  let d = new Date(date);
  
  // Fetch calendar entries for the next 30 days to optimize db query count
  const endDate = new Date(d);
  endDate.setDate(endDate.getDate() + 30);
  
  const calendarEntries = await prisma.factoryCalendar.findMany({
    where: {
      date: {
        gte: new Date(d.toISOString().split('T')[0] + 'T00:00:00.000Z'),
        lte: new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z')
      }
    }
  });

  const holidayDates = new Set(
    calendarEntries
      .filter(e => !e.is_working_day)
      .map(e => e.date.toISOString().split('T')[0])
  );

  while (true) {
    // 1. Check if Sunday (0)
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
      continue;
    }
    
    // 2. Check if explicitly marked as holiday in FactoryCalendar
    const dateStr = d.toISOString().split('T')[0];
    if (holidayDates.has(dateStr)) {
      d.setDate(d.getDate() + 1);
      continue;
    }
    
    break;
  }
  return d;
}

module.exports = {
  calculateDueDate,
  getNextWorkingDay
};
