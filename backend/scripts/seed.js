require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/db');

async function main() {
  const email = process.env.SEED_EMAIL || 'admin@bdl.local';
  const password = process.env.SEED_PASSWORD || 'admin123';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Seed user already exists:', email);
    return;
  }
  const password_hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      employee_no: 'EMP-001',
      name: 'Admin User',
      email,
      password_hash,
      role: 'Admin',
    },
  });
  console.log('Created seed user:', email, '/', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
