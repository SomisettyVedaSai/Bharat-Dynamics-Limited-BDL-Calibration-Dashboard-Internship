const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all equipment...");
  const equipments = await prisma.equipmentMaster.findMany();
  console.log(`Found ${equipments.length} equipment items.`);

  for (const eq of equipments) {
    console.log(`\nTesting delete for equipment: ID=${eq.equipment_id}, No=${eq.equipment_no}`);
    try {
      await prisma.$transaction(async (tx) => {
        const calibrations = await tx.calibrationRecord.findMany({
          where: { equipment_id: eq.equipment_id },
          select: { calibration_id: true }
        });
        const calIds = calibrations.map(c => c.calibration_id);
        console.log(`- Calibrations count: ${calIds.length}`);

        const narrCount = await tx.instrumentNarrative.deleteMany({
          where: { calibration_id: { in: calIds } }
        });
        console.log(`- Narratives deleted: ${narrCount.count}`);

        const certCount = await tx.calibrationCertificate.deleteMany({
          where: { calibration_id: { in: calIds } }
        });
        console.log(`- Certificates deleted: ${certCount.count}`);

        const inspCount = await tx.inspectionRecord.deleteMany({
          where: {
            OR: [
              { equipment_id: eq.equipment_id },
              { calibration_id: { in: calIds } }
            ]
          }
        });
        console.log(`- Inspections deleted: ${inspCount.count}`);

        const calRecCount = await tx.calibrationRecord.deleteMany({
          where: { equipment_id: eq.equipment_id }
        });
        console.log(`- Calibration Records deleted: ${calRecCount.count}`);

        const statCount = await tx.statusHistory.deleteMany({
          where: { equipment_id: eq.equipment_id }
        });
        console.log(`- Status History deleted: ${statCount.count}`);

        const eqDel = await tx.equipmentMaster.delete({
          where: { equipment_id: eq.equipment_id }
        });
        console.log(`- Equipment itself deleted successfully.`);

        throw new Error("DRY_RUN_ROLLBACK");
      });
    } catch (err) {
      if (err.message === "DRY_RUN_ROLLBACK") {
        console.log("-> Transaction simulated successfully!");
      } else {
        console.error("-> TRANSACTION FAILED:", err);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
