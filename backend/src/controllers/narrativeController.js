const prisma = require('../utils/db');
const { mapPrismaError } = require('../utils/prismaErrors');

exports.createNarrative = async (req, res) => {
  try {
    const { calibration_id, characteristic_name, explanation, weakness, summary_paragraph, memory_story, storyboard_json, character_description, setting_description, plot_description, theme_description, conflict_description, resolution_description } = req.body;

    if (!characteristic_name?.trim()) {
      return res.status(400).json({ error: 'characteristic_name is required' });
    }

    const narrative = await prisma.instrumentNarrative.create({
      data: {
        calibration_id: calibration_id,
        characteristic_name,
        explanation,
        weakness,
        summary_paragraph,
        memory_story,
        storyboard_json,
        character_description,
        setting_description,
        plot_description,
        theme_description,
        conflict_description,
        resolution_description
      }
    });

    res.status(201).json({ message: 'Narrative saved successfully', narrative });
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.getNarratives = async (req, res) => {
  try {
    const narratives = await prisma.instrumentNarrative.findMany({
      include: {
        calibration: {
          include: { equipment: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json(narratives);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};

exports.getNarrativeByCalibrationId = async (req, res) => {
  try {
    const narrative = await prisma.instrumentNarrative.findFirst({
      where: { calibration_id: req.params.calibration_id }
    });
    
    if (!narrative) {
      return res.status(404).json({ error: 'Narrative not found' });
    }
    
    res.status(200).json(narrative);
  } catch (error) {
    const mapped = mapPrismaError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
};
