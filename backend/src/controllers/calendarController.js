const prisma = require('../utils/db');
const { mapPrismaError } = require('../utils/prismaErrors');

exports.addWorkingDay = async (req, res) => {
  try {
    const { date, is_working_day, description } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });
    if (typeof is_working_day !== 'boolean') {
      return res.status(400).json({ error: 'is_working_day must be true or false' });
    }
    const calendar = await prisma.factoryCalendar.upsert({
      where: { date: new Date(date) },
      update: { is_working_day, description },
      create: { date: new Date(date), is_working_day, description }
    });
    res.status(200).json(calendar);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.getCalendar = async (req, res) => {
  try {
    const calendar = await prisma.factoryCalendar.findMany({
      orderBy: { date: 'asc' }
    });
    res.status(200).json(calendar);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.deleteCalendarDay = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.factoryCalendar.delete({
      where: { calendar_id: id }
    });
    res.status(200).json({ message: 'Calendar day deleted successfully' });
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.bulkAddHolidays = async (req, res) => {
  try {
    const { year } = req.body;
    if (!year || isNaN(year)) {
      return res.status(400).json({ error: 'Valid year is required' });
    }

    const y = parseInt(year);
    const entries = [];

    // Indian National / standard holidays definition
    // Month index is 0-based: 0 = Jan, 4 = May, 7 = Aug, 9 = Oct, 11 = Dec
    const nationalHolidays = [
      { month: 0, day: 26, name: 'Republic Day' },
      { month: 4, day: 1, name: 'May Day' },
      { month: 7, day: 15, name: 'Independence Day' },
      { month: 9, day: 2, name: 'Gandhi Jayanti' },
      { month: 11, day: 25, name: 'Christmas' }
    ];

    // Loop through the entire year using UTC to avoid timezone shifting issues
    let current = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y, 11, 31));

    while (current <= end) {
      const isSunday = current.getUTCDay() === 0;
      const matchingNat = nationalHolidays.find(nh => nh.month === current.getUTCMonth() && nh.day === current.getUTCDate());

      if (isSunday || matchingNat) {
        let desc = isSunday ? 'Sunday' : `National Holiday (${matchingNat.name})`;
        if (isSunday && matchingNat) {
          desc = `Sunday & National Holiday (${matchingNat.name})`;
        }

        entries.push({
          date: new Date(current.toISOString()),
          is_working_day: false,
          description: desc
        });
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Run bulk upserts in a Prisma transaction
    await prisma.$transaction(
      entries.map(entry =>
        prisma.factoryCalendar.upsert({
          where: { date: entry.date },
          update: { is_working_day: entry.is_working_day, description: entry.description },
          create: { date: entry.date, is_working_day: entry.is_working_day, description: entry.description }
        })
      )
    );

    res.status(200).json({ message: `Bulk holidays generated for year ${y}`, count: entries.length });
  } catch (error) {
    console.error('Bulk holidays error:', error);
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};
