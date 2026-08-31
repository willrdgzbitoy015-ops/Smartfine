const express = require('express');
const cors = require('cors');

const authRoutes =
  require('./routes/auth');

const dashboardRoutes =
  require('./routes/dashboard');

const studentsRoutes =
  require('./routes/students');

const app = express();

const PORT = 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

// ==========================================
// ROUTES
// ==========================================

app.use(
  '/api/dashboard',
  dashboardRoutes
);

app.use(
  '/api/students',
  studentsRoutes
);

app.use(
  '/api/auth',
  authRoutes
);

// ==========================================
// API TEST
// ==========================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message:
      'SmartFine API is running.',
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `SmartFine server running on port ${PORT}`
    );
  }
);