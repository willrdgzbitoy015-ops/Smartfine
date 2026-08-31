const express = require('express');
const cors = require('cors');

// routes for the application

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

const PORT = 3000;

// api na need para ma acccess

app.use(cors());
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SmartFine API is running.',
  });
});

app.use('/api/auth', authRoutes);

// direct route for testing dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    message: 'Direct dashboard route works',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SmartFine server running on port ${PORT}`);
});