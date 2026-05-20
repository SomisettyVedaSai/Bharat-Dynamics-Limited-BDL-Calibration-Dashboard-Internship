const prisma = require('../utils/db');
const { mapPrismaError } = require('../utils/prismaErrors');
const { calculateDueDate, getNextWorkingDay } = require('../utils/calendarHelper');
const certificateGenerator = require('../services/certificateGenerator');
const labelGenerator = require('../services/labelGenerator');

function mapRecordToFrontend(cal, equipment, inspection) {
  const insp = inspection?.[0] || inspection;
  return {
    id: cal.calibration_id,
    equipment_id: cal.equipment_id,
    equipment_no: equipment?.equipment_no,
    serial_no: equipment?.serial_no,
    description_name: equipment?.description_name,
    unit: equipment?.unit,
    calibration_date: cal.calibration_date,
    nominal_value: cal.nominal_value,
    measured_value: cal.measured_value,
    tolerance_value: cal.tolerance_value,
    lower_limit: cal.lower_limit,
    upper_limit: cal.upper_limit,
    error_value: cal.error_value,
    q01_tolerance: equipment?.q01_tolerance,
    result: cal.result,
    inspection: insp
      ? {
          rust_status: insp.rust_status,
          rust_description: insp.rust_description,
          dent_status: insp.dent_status,
          dent_description: insp.dent_description,
          damage_status: insp.damage_status,
          damage_description: insp.damage_description,
          surface_finish_status: insp.surface_finish_status,
          surface_finish_description: insp.surface_finish_description,
        }
      : null,
    go_size: insp?.go_size ?? null,
    no_go_size: insp?.no_go_size ?? null,
  };
}

exports.createCalibration = async (req, res) => {
  try {
    const {
      equipment_id,
      nominal_value,
      measured_value,
      tolerance_value,
      calibrated_by,
      inspection_data,
      current_status,
    } = req.body;

    if (!equipment_id) return res.status(400).json({ error: 'equipment_id is required' });
    if ([nominal_value, measured_value, tolerance_value].some((v) => v === undefined || Number.isNaN(Number(v)))) {
      return res.status(400).json({ error: 'nominal_value, measured_value, and tolerance_value are required numbers' });
    }

    const equipment = await prisma.equipmentMaster.findUnique({ where: { equipment_id } });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });



    const nom = Number(nominal_value);
    const meas = Number(measured_value);
    const tol = Number(tolerance_value);
    const q01_tolerance = equipment.q01_tolerance;

    const upper_limit = nom + tol;
    const lower_limit = nom - tol;
    const error_value = meas - nom;
    const in_tolerance = meas >= lower_limit && meas <= upper_limit;
    const within_q01 = Math.abs(error_value) <= q01_tolerance;
    const pass_fail_q01 = in_tolerance && within_q01;

    let inspection_pass = true;
    if (inspection_data) {
      const fails = ['rust_status', 'dent_status', 'damage_status', 'surface_finish_status'].some(
        (k) => inspection_data[k] === 'NOT OK'
      );
      if (fails) inspection_pass = false;
    }

    const result = pass_fail_q01 && inspection_pass ? 'PASS' : 'FAIL';
    const oldEndDate = equipment.calibration_due_date;
    const newStart = oldEndDate ? new Date(oldEndDate) : new Date();
    const rawDueDate = calculateDueDate(newStart, equipment.periodicity_value, equipment.periodicity_unit || 'Days');
    const next_due_date = await getNextWorkingDay(rawDueDate);

    const newStatus = current_status || (result === 'PASS' ? 'Active' : 'Scrapped');

    const transaction = await prisma.$transaction(async (tx) => {
      const calibration = await tx.calibrationRecord.create({
        data: {
          equipment_id,
          calibration_date: new Date(),
          next_due_date,
          nominal_value: nom,
          measured_value: meas,
          tolerance_value: tol,
          lower_limit,
          upper_limit,
          error_value,
          pass_fail_q01,
          result,
          calibrated_by: calibrated_by || req.user?.employee_no || 'system',
        },
      });

      if (inspection_data) {
        await tx.inspectionRecord.create({
          data: {
            equipment_id,
            calibration_id: calibration.calibration_id,
            rust_status: inspection_data.rust_status || 'OK',
            rust_description: inspection_data.rust_description || null,
            dent_status: inspection_data.dent_status || 'OK',
            dent_description: inspection_data.dent_description || null,
            damage_status: inspection_data.damage_status || 'OK',
            damage_description: inspection_data.damage_description || null,
            surface_finish_status: inspection_data.surface_finish_status || 'OK',
            surface_finish_description: inspection_data.surface_finish_description || null,
            go_size: inspection_data.go_size != null ? Number(inspection_data.go_size) : null,
            no_go_size: inspection_data.no_go_size != null ? Number(inspection_data.no_go_size) : null,
            remarks: inspection_data.remarks || '',
            inspected_by: calibrated_by || req.user?.employee_no || 'system',
          },
        });
      }

      // After calibration: roll dates forward
      // new start = previous due date (oldEndDate), new due = new start + periodicity
      await tx.equipmentMaster.update({
        where: { equipment_id },
        data: {
          current_status: newStatus,
          calibration_start_date: newStart,
          calibration_due_date: next_due_date,
        },
      });

      return calibration;
    });

    const full = await prisma.calibrationRecord.findUnique({
      where: { calibration_id: transaction.calibration_id },
      include: { inspection_records: true, equipment: true },
    });

    let certificate = null;
    if (result === 'PASS') {
      try {
        const certNo = `CAL-${new Date().getFullYear()}-${String(transaction.calibration_id).padStart(4, '0')}`;
        const inspection = full.inspection_records?.[0] || {};
        
        const pdfPath = await certificateGenerator.generateCertificatePDF({
          certificate_no: certNo,
          equipment: full.equipment,
          result: full.result,
          calibration_date: full.calibration_date,
          next_due_date: full.next_due_date,
          nominal_value: full.nominal_value,
          measured_value: full.measured_value,
          tolerance_value: full.tolerance_value,
          error_value: full.error_value,
          lower_limit: full.lower_limit,
          upper_limit: full.upper_limit,
          go_size: inspection.go_size,
          no_go_size: inspection.no_go_size,
          rust_status: inspection.rust_status,
          dent_status: inspection.dent_status,
          damage_status: inspection.damage_status,
          surface_finish_status: inspection.surface_finish_status,
          calibrated_by: full.calibrated_by,
          approved_by: full.approved_by,
        });

        const labelPath = await labelGenerator.generateIndustrialLabel({
          equipment: full.equipment,
          result: full.result,
          calibration_date: full.calibration_date,
          next_due_date: full.next_due_date,
        });

        certificate = await prisma.calibrationCertificate.create({
          data: {
            calibration_id: transaction.calibration_id,
            certificate_no: certNo,
            pdf_path: pdfPath,
            label_path: labelPath,
          },
        });
      } catch (certError) {
        console.error('Failed to auto-generate certificate/label:', certError);
      }
    }

    res.status(201).json({
      message: 'Calibration completed',
      record: mapRecordToFrontend(full, full.equipment, full.inspection_records),
      certificate: certificate,
    });
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.getCalibrationsByEquipment = async (req, res) => {
  try {
    const records = await prisma.calibrationRecord.findMany({
      where: { equipment_id: req.params.id },
      orderBy: { calibration_date: 'desc' },
      include: { inspection_records: true, equipment: true },
    });
    res.status(200).json(records.map((r) => mapRecordToFrontend(r, r.equipment, r.inspection_records)));
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.getRecentCalibrations = async (req, res) => {
  try {
    const records = await prisma.calibrationRecord.findMany({
      orderBy: { calibration_date: 'desc' },
      take: 100,
      include: { inspection_records: true, equipment: true },
    });
    res.status(200).json(records.map((r) => mapRecordToFrontend(r, r.equipment, r.inspection_records)));
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};
