const prisma = require('../utils/db');
const certificateGenerator = require('../services/certificateGenerator');
const labelGenerator = require('../services/labelGenerator');
const { mapPrismaError } = require('../utils/prismaErrors');

exports.generateCertificateAndLabel = async (req, res) => {
  try {
    const { calibration_id } = req.body;

    // Fetch the full calibration record
    const calibration = await prisma.calibrationRecord.findUnique({
      where: { calibration_id: calibration_id },
      include: { equipment: true, inspection_records: true }
    });

    if (!calibration) {
      return res.status(404).json({ error: 'Calibration record not found' });
    }

    // Generate unique Certificate No (e.g. CAL-2026-0001)
    const certNo = `CAL-${new Date().getFullYear()}-${String(calibration.calibration_id).padStart(4, '0')}`;

    const inspection = calibration.inspection_records?.[0] || {};

    const pdfPath = await certificateGenerator.generateCertificatePDF({
      certificate_no: certNo,
      equipment: calibration.equipment,
      result: calibration.result,
      calibration_date: calibration.calibration_date,
      next_due_date: calibration.next_due_date,
      nominal_value: calibration.nominal_value,
      measured_value: calibration.measured_value,
      tolerance_value: calibration.tolerance_value,
      error_value: calibration.error_value,
      lower_limit: calibration.lower_limit,
      upper_limit: calibration.upper_limit,
      go_size: inspection.go_size,
      no_go_size: inspection.no_go_size,
      rust_status: inspection.rust_status,
      dent_status: inspection.dent_status,
      damage_status: inspection.damage_status,
      surface_finish_status: inspection.surface_finish_status,
      calibrated_by: calibration.calibrated_by,
      approved_by: calibration.approved_by,
    });

    const labelPath = await labelGenerator.generateIndustrialLabel({
      equipment: calibration.equipment,
      result: calibration.result,
      calibration_date: calibration.calibration_date,
      next_due_date: calibration.next_due_date
    });

    // Save certificate record
    const certificate = await prisma.calibrationCertificate.create({
      data: {
        calibration_id: calibration.calibration_id,
        certificate_no: certNo,
        pdf_path: pdfPath,
        label_path: labelPath
      }
    });

    res.status(201).json({
      message: 'Certificate and Label generated successfully',
      certificate
    });

  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.getCertificates = async (req, res) => {
  try {
    const certs = await prisma.calibrationCertificate.findMany({
      include: {
        calibration: {
          include: { equipment: true }
        }
      },
      orderBy: { generated_date: 'desc' }
    });
    res.status(200).json(certs);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};
