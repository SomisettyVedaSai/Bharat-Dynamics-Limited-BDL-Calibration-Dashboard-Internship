const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');

const ALLOWED_ROLES = ['Admin', 'Inspector', 'Calibration Engineer', 'Viewer'];

exports.register = async (req, res) => {
  try {
    const { employee_no, name, email, password, role, id_proof_url } = req.body;

    if (!employee_no || !name || !email || !password) {
      return res.status(400).json({ error: 'employee_no, name, email, and password are required' });
    }
    const safeRole = ALLOWED_ROLES.includes(role) ? role : 'Viewer';

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employee_no }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or employee number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        employee_no,
        name,
        email,
        password_hash,
        role: safeRole,
        id_proof_url
      }
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.user_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server auth not configured' });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: email.trim() }, { employee_no: email.trim() }] },
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, employee_no: user.employee_no },
      secret,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee_no: user.employee_no
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};
