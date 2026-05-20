const prisma = require('../utils/db');
const { mapPrismaError } = require('../utils/prismaErrors');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.getDashboardStats = async (req, res) => {
  try {
    const [dueCalibrations, failedInstruments, underCalibration, generalStore, activeCount, calibrations, recentFailed] =
      await Promise.all([
        prisma.equipmentMaster.count({ where: { current_status: 'Due' } }),
        prisma.equipmentMaster.count({ where: { current_status: 'Scrapped' } }),
        prisma.equipmentMaster.count({ where: { current_status: 'Under Calibration' } }),
        prisma.equipmentMaster.count({ where: { current_status: 'General Store' } }),
        prisma.equipmentMaster.count({ where: { current_status: 'Active' } }),
        prisma.calibrationRecord.findMany({
          select: { result: true, calibration_date: true, error_value: true, equipment_id: true },
          orderBy: { calibration_date: 'desc' },
          take: 500,
        }),
        prisma.calibrationRecord.findMany({
          where: { result: 'FAIL' },
          orderBy: { calibration_date: 'desc' },
          take: 5,
          include: { equipment: { select: { equipment_no: true, description_name: true } } },
        }),
      ]);

    const passFailByMonth = {};
    for (const cal of calibrations) {
      const d = new Date(cal.calibration_date);
      const key = MONTHS[d.getMonth()];
      if (!passFailByMonth[key]) passFailByMonth[key] = { month: key, pass: 0, fail: 0 };
      if (cal.result === 'PASS') passFailByMonth[key].pass += 1;
      else passFailByMonth[key].fail += 1;
    }
    const passFailData = Object.values(passFailByMonth).slice(-6);
    if (passFailData.length === 0) {
      passFailData.push({ month: MONTHS[new Date().getMonth()], pass: 0, fail: 0 });
    }

    const driftRecords = calibrations
      .filter((c) => c.error_value != null)
      .slice(0, 12)
      .reverse()
      .map((c) => ({
        date: new Date(c.calibration_date).toISOString().slice(0, 7),
        error: c.error_value,
      }));

    const alerts = recentFailed.map((c) => ({
      id: c.calibration_id,
      title: `${c.equipment?.description_name || 'Instrument'} ${c.equipment?.equipment_no || ''} FAILED`,
      subtitle: new Date(c.calibration_date).toLocaleString(),
      type: 'fail',
      equipment_no: c.equipment?.equipment_no,
    }));

    res.status(200).json({
      summary: {
        dueCalibrations,
        failedInstruments,
        underCalibration,
        generalStore,
        activeInstruments: activeCount,
      },
      charts: { passFailData, driftData: driftRecords },
      alerts,
    });
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};
