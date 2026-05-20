const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const authMiddleware = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const prisma = require('./utils/db');

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    res.status(200).json({ status: 'OK', message: 'CMS Backend is running smoothly.', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'DEGRADED', message: 'API up but database unreachable', database: 'disconnected' });
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use(authMiddleware);
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));
app.use('/api/calibration', require('./routes/calibrationRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/narratives', require('./routes/narrativeRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

const http = require('http');
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Restart 1

module.exports = app;
