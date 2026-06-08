const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'LGUbatuan1990',
  database: 'facility_reservation_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }

  console.log('Connected to MySQL');
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/api/dashboard/recent-confirmed', (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const sql = `SELECT res_id, res_fullname, res_facility, date_of_use, status FROM reservations WHERE LOWER(status) = 'confirmed' ORDER BY date_of_use DESC LIMIT ?`;

  db.query(sql, [limit], (err, results) => {
    if (err) {
      console.error('Failed to query recent confirmed reservations:', err);
      return res.status(500).json({ error: 'Failed to load recent confirmed reservations' });
    }

    res.json(Array.isArray(results) ? results : []);
  });
});

app.get('/api/dashboard/pending-count', (req, res) => {
  const sql = `
    SELECT COUNT(*) AS count
    FROM reservations
    WHERE LOWER(TRIM(status)) = 'pending'
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching pending count:', err);
      return res.status(500).json({ count: 0 });
    }

    res.json({
      count: results[0].count
    });
  });
});

 app.post('/api/login', (req, res) => {
  const { user_name, password } = req.body;

  // HARD CODED ADMIN LOGIN
  if (user_name === 'admin' && password === 'admin123') {
    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 1,
        name: 'Administrator',
        user_name: 'admin',
        user_type: 'Admin'
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Incorrect username or password'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
