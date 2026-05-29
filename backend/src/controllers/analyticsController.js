const prisma = require('../utils/db');
const { mapPrismaError } = require('../utils/prismaErrors');
const XLSX = require('xlsx');
const reportPdfGenerator = require('../services/reportPdfGenerator');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [
      dueCalibrations,
      failedInstruments,
      underCalibration,
      generalStore,
      activeCount,
      calibrations,
      recentFailed,
    ] = await Promise.all([
      // Due = equipment whose calibration_due_date has passed (or is today) AND status is Active
      prisma.equipmentMaster.count({
        where: {
          calibration_due_date: { lte: today },
          current_status: { in: ['Active', 'Due'] },
        },
      }),
      // Failed/Scrapped = Failed OR Scrapped status
      prisma.equipmentMaster.count({
        where: { current_status: { in: ['Failed', 'Scrapped'] } },
      }),
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

    // ── Pass/Fail by month chart ──────────────────────────────
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

    // ── Drift analytics ──────────────────────────────────────
    const driftRecords = calibrations
      .filter((c) => c.error_value != null)
      .slice(0, 12)
      .reverse()
      .map((c) => ({
        date: new Date(c.calibration_date).toISOString().slice(0, 7),
        error: c.error_value,
      }));

    // ── Alerts (recent failures) ─────────────────────────────
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

// ── Master Report — Excel ──────────────────────────────────────────────────
exports.getMasterReport = async (req, res) => {
  try {
    const [equipment, calibrations] = await Promise.all([
      prisma.equipmentMaster.findMany({
        orderBy: { created_at: 'asc' },
      }),
      prisma.calibrationRecord.findMany({
        orderBy: { calibration_date: 'desc' },
        include: {
          equipment: {
            select: {
              equipment_no: true,
              description_name: true,
              serial_no: true,
              unit: true,
              plant_location: true,
              storage_location: true,
            },
          },
          inspection_records: true,
        },
      }),
    ]);

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Equipment Master List ──────────────────────
    const eqRows = equipment.map((e) => ({
      'Equipment No.': e.equipment_no,
      'Equipment Type': e.equipment_type,
      'Description / Name': e.description_name,
      'Serial No.': e.serial_no || '',
      'Material Code': e.material_code || '',
      'Manufacturer No.': e.manufacturer_no || '',
      'Technical No.': e.technical_no || '',
      'Range Min': e.range_min,
      'Range Max': e.range_max,
      'Unit': e.unit,
      'Accuracy': e.accuracy ?? '',
      'Least Count': e.least_count ?? '',
      'Q01 Tolerance (±)': e.q01_tolerance,
      'Deviation Allowed': e.deviation_allowed ?? '',
      'Calibration Period (Days)': e.periodicity_value,
      'Calibration Period Unit': e.periodicity_unit,
      'Calibration Start Date': e.calibration_start_date
        ? new Date(e.calibration_start_date).toLocaleDateString()
        : '',
      'Calibration Due Date': e.calibration_due_date
        ? new Date(e.calibration_due_date).toLocaleDateString()
        : '',
      'Current Status': e.current_status,
      'Plant Name': e.plant_name || '',
      'Plant Location': e.plant_location || '',
      'Storage Location': e.storage_location || '',
      'Place': e.place || '',
      'Pincode': e.pincode || '',
      'Employee ID': e.employee_id || '',
      'Employee Name': e.employee_name || '',
      'Registered On': new Date(e.created_at).toLocaleDateString(),
    }));

    const eqSheet = XLSX.utils.json_to_sheet(eqRows);
    // Set column widths
    eqSheet['!cols'] = [
      { wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 14 },
      { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 8 },
      { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 22 },
      { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 16 },
      { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 14 },
      { wch: 18 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, eqSheet, 'Equipment Master');

    // ── Sheet 2: Calibration Records ────────────────────────
    const calRows = calibrations.map((c) => {
      const insp = c.inspection_records?.[0];
      return {
        'Equipment No.': c.equipment?.equipment_no || '',
        'Description / Name': c.equipment?.description_name || '',
        'Serial No.': c.equipment?.serial_no || '',
        'Unit': c.equipment?.unit || '',
        'Calibration Date': new Date(c.calibration_date).toLocaleDateString(),
        'Next Due Date': new Date(c.next_due_date).toLocaleDateString(),
        'Nominal Value': c.nominal_value,
        'Measured Value': c.measured_value,
        'Tolerance (±)': c.tolerance_value,
        'Lower Limit': c.lower_limit,
        'Upper Limit': c.upper_limit,
        'Error (Meas − Nom)': c.error_value,
        'Within Q01': c.pass_fail_q01 ? 'YES' : 'NO',
        'Result': c.result,
        'Calibrated By': c.calibrated_by,
        'Approved By': c.approved_by || '',
        'Remarks': c.remarks || '',
        'Rust': insp?.rust_status || '',
        'Dent': insp?.dent_status || '',
        'Damage': insp?.damage_status || '',
        'Surface Finish': insp?.surface_finish_status || '',
        'Go Size': insp?.go_size ?? '',
        'No-Go Size': insp?.no_go_size ?? '',
        'Plant Location': c.equipment?.plant_location || '',
        'Storage Location': c.equipment?.storage_location || '',
      };
    });

    const calSheet = XLSX.utils.json_to_sheet(calRows);
    calSheet['!cols'] = [
      { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 8 }, { wch: 16 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
      { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 18 },
      { wch: 18 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, calSheet, 'Calibration Records');

    // ── Sheet 3: Summary ────────────────────────────────────
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dueCount = equipment.filter(
      (e) => e.calibration_due_date && new Date(e.calibration_due_date) <= today && ['Active', 'Due'].includes(e.current_status)
    ).length;
    const failedCount = equipment.filter((e) => ['Failed', 'Scrapped'].includes(e.current_status)).length;
    const underCalCount = equipment.filter((e) => e.current_status === 'Under Calibration').length;
    const generalStoreCount = equipment.filter((e) => e.current_status === 'General Store').length;
    const activeCount = equipment.filter((e) => e.current_status === 'Active').length;
    const totalCals = calibrations.length;
    const totalPass = calibrations.filter((c) => c.result === 'PASS').length;
    const totalFail = calibrations.filter((c) => c.result === 'FAIL').length;

    const summaryRows = [
      { 'Metric': 'Report Generated On', 'Value': new Date().toLocaleString() },
      { 'Metric': '', 'Value': '' },
      { 'Metric': '── EQUIPMENT SUMMARY ──', 'Value': '' },
      { 'Metric': 'Total Equipment Registered', 'Value': equipment.length },
      { 'Metric': 'Active Instruments', 'Value': activeCount },
      { 'Metric': 'Due for Calibration', 'Value': dueCount },
      { 'Metric': 'Under Calibration', 'Value': underCalCount },
      { 'Metric': 'Failed / Scrapped', 'Value': failedCount },
      { 'Metric': 'In General Store', 'Value': generalStoreCount },
      { 'Metric': '', 'Value': '' },
      { 'Metric': '── CALIBRATION SUMMARY ──', 'Value': '' },
      { 'Metric': 'Total Calibrations Performed', 'Value': totalCals },
      { 'Metric': 'Total Passed', 'Value': totalPass },
      { 'Metric': 'Total Failed', 'Value': totalFail },
      { 'Metric': 'Overall Pass Rate (%)', 'Value': totalCals > 0 ? ((totalPass / totalCals) * 100).toFixed(1) + '%' : 'N/A' },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // ── Send as Excel file ──────────────────────────────────
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `BDL-CMS-Master-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.getMasterReportPdf = async (req, res) => {
  try {
    const [equipment, calibrations] = await Promise.all([
      prisma.equipmentMaster.findMany({
        orderBy: { created_at: 'asc' },
      }),
      prisma.calibrationRecord.findMany({
        orderBy: { calibration_date: 'desc' },
        include: {
          equipment: {
            select: {
              equipment_no: true,
              description_name: true,
              serial_no: true,
              unit: true,
              plant_location: true,
              storage_location: true,
              equipment_type: true,
              current_status: true,
              calibration_due_date: true,
            },
          },
        },
      }),
    ]);

    // Compute stats matching the Excel sheet summary
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const dueCount = equipment.filter(
      (e) => e.calibration_due_date && new Date(e.calibration_due_date) <= today && ['Active', 'Due'].includes(e.current_status)
    ).length;
    const failedCount = equipment.filter((e) => ['Failed', 'Scrapped'].includes(e.current_status)).length;
    const underCalCount = equipment.filter((e) => e.current_status === 'Under Calibration').length;
    const generalStoreCount = equipment.filter((e) => e.current_status === 'General Store').length;
    const activeCount = equipment.filter((e) => e.current_status === 'Active').length;
    
    const totalCals = calibrations.length;
    const totalPass = calibrations.filter((c) => c.result === 'PASS').length;
    const totalFail = calibrations.filter((c) => c.result === 'FAIL').length;
    const passRate = totalCals > 0 ? ((totalPass / totalCals) * 100).toFixed(1) + '%' : 'N/A';

    const summary = {
      dueCount,
      failedCount,
      underCalCount,
      generalStoreCount,
      activeCount,
      totalCals,
      totalPass,
      totalFail,
      passRate
    };

    const pdfBuffer = await reportPdfGenerator.generateMasterReportPDF(equipment, calibrations, summary);
    const filename = `BDL-CMS-Master-Report-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};
