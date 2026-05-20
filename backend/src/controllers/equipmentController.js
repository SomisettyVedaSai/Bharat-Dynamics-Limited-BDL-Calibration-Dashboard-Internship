const prisma = require('../utils/db');
const { mapPrismaError } = require('../utils/prismaErrors');
const { getNextWorkingDay } = require('../utils/calendarHelper');

// ── Date helper ──────────────────────────────────────────
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

const ALLOWED_CREATE = [
  'equipment_no', 'equipment_type', 'description_name', 'material_code', 'serial_no',
  'manufacturer_no', 'technical_no', 'range_min', 'range_max', 'accuracy', 'least_count',
  'deviation_allowed', 'q01_tolerance', 'unit', 'plant_location_id', 'storage_location_id',
  'maintenance_plan_id', 'factory_calendar_id', 'periodicity_value', 'periodicity_unit',
  'calibration_start_date', 'current_status', 'calibration_standard_id',
  'maintenance_plan', 'plant_location', 'storage_location', 'plant_name', 'place', 'pincode', 'employee_id', 'employee_name', 'qr_code_scanned'
];

const ALLOWED_UPDATE = ALLOWED_CREATE.filter((f) => f !== 'equipment_no');

function pickAllowed(body, fields) {
  const data = {};
  for (const key of fields) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

function validateEquipmentPayload(data, isCreate) {
  if (isCreate) {
    if (!data.equipment_no?.trim()) return 'Equipment number is required';
    if (!data.description_name?.trim()) return 'Description is required';
    if (!data.equipment_type?.trim()) return 'Equipment type is required';
    if (data.range_min === undefined || data.range_max === undefined) return 'Range min and max are required';
    if (!data.unit?.trim()) return 'Unit is required';
    if (!data.periodicity_value) return 'Calibration period is required';
    if (!data.current_status?.trim()) return 'Status is required';
  }
  if (data.range_min !== undefined && data.range_max !== undefined && data.range_min > data.range_max) {
    return 'Range min cannot exceed range max';
  }
  return null;
}

exports.createEquipment = async (req, res) => {
  try {
    const data = pickAllowed(req.body, ALLOWED_CREATE);
    const validationError = validateEquipmentPayload(data, true);
    if (validationError) return res.status(400).json({ error: validationError });

    // Parse and compute calibration dates
    if (data.calibration_start_date) {
      data.calibration_start_date = new Date(data.calibration_start_date);
      const rawDueDate = calculateDueDate(
        data.calibration_start_date,
        data.periodicity_value,
        data.periodicity_unit || 'Days'
      );
      data.calibration_due_date = await getNextWorkingDay(rawDueDate);
    }

    const equipment = await prisma.equipmentMaster.create({ data });
    res.status(201).json(equipment);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.getAllEquipment = async (req, res) => {
  try {
    const equipment = await prisma.equipmentMaster.findMany({ orderBy: { created_at: 'desc' } });
    res.status(200).json(equipment);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.getEquipmentById = async (req, res) => {
  try {
    const equipment = await prisma.equipmentMaster.findUnique({
      where: { equipment_id: req.params.id },
    });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
    res.status(200).json(equipment);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.updateEquipment = async (req, res) => {
  try {
    const data = pickAllowed(req.body, ALLOWED_UPDATE);
    const validationError = validateEquipmentPayload(data, false);
    if (validationError) return res.status(400).json({ error: validationError });

    // Re-compute due date if start date or periodicity changed
    if (data.calibration_start_date !== undefined || data.periodicity_value !== undefined || data.periodicity_unit !== undefined) {
      const existing = await prisma.equipmentMaster.findUnique({ where: { equipment_id: req.params.id } });
      const startDate = data.calibration_start_date !== undefined
        ? (data.calibration_start_date ? new Date(data.calibration_start_date) : null)
        : (existing?.calibration_start_date ? new Date(existing.calibration_start_date) : null);

      if (startDate) {
        if (data.calibration_start_date !== undefined) {
          data.calibration_start_date = startDate;
        }
        const pValue = data.periodicity_value ?? existing?.periodicity_value ?? 365;
        const pUnit  = data.periodicity_unit  ?? existing?.periodicity_unit  ?? 'Days';
        const rawDueDate = calculateDueDate(startDate, pValue, pUnit);
        data.calibration_due_date = await getNextWorkingDay(rawDueDate);
      } else {
        data.calibration_due_date = null;
      }
    }

    const equipment = await prisma.equipmentMaster.update({
      where: { equipment_id: req.params.id },
      data,
    });
    res.status(200).json(equipment);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.deleteEquipment = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      // Find all calibration records for this equipment
      const calibrations = await tx.calibrationRecord.findMany({
        where: { equipment_id: id },
        select: { calibration_id: true }
      });
      const calIds = calibrations.map(c => c.calibration_id);

      // Delete narratives linked to these calibrations
      await tx.instrumentNarrative.deleteMany({
        where: { calibration_id: { in: calIds } }
      });

      // Delete certificates linked to these calibrations
      await tx.calibrationCertificate.deleteMany({
        where: { calibration_id: { in: calIds } }
      });

      // Delete inspection records linked to this equipment or calibrations
      await tx.inspectionRecord.deleteMany({
        where: {
          OR: [
            { equipment_id: id },
            { calibration_id: { in: calIds } }
          ]
        }
      });

      // Delete calibration records
      await tx.calibrationRecord.deleteMany({
        where: { equipment_id: id }
      });

      // Delete status history
      await tx.statusHistory.deleteMany({
        where: { equipment_id: id }
      });

      // Delete the equipment itself
      await tx.equipmentMaster.delete({
        where: { equipment_id: id }
      });
    });

    res.status(200).json({ message: 'Equipment and all related records deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

// Export helper so calibration controller can reuse it
exports.calculateDueDate = calculateDueDate;
