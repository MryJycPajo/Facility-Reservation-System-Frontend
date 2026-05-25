const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Sample data
const overview = {
  totalReservations: 447,
  activeFacilities: 12,
  totalUsers: 1284,
  revenueMTD: 19500,
  quickStats: {
    completed: 231,
    pending: 42,
    confirmed: 156,
    cancelled: 18
  }
};

const trends = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  reservations: [45, 55, 65, 60, 75]
};

const revenue = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  revenue: [12000, 14000, 16500, 15500, 20000]
};

const statusDistribution = {
  labels: ['Confirmed', 'Completed', 'Pending', 'Cancelled'],
  counts: [150, 120, 100, 30]
};

app.get('/api/overview', (req, res) => {
  res.json(overview);
});

app.get('/api/trends', (req, res) => {
  res.json(trends);
});

app.get('/api/revenue', (req, res) => {
  res.json(revenue);
});

app.get('/api/status', (req, res) => {
  res.json(statusDistribution);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    return res.json({ success: true, message: 'Login successful' });
  }

  return res.status(401).json({ success: false, message: 'Incorrect username or password' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
