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

db.query(`
  CREATE TABLE IF NOT EXISTS facility_addons (
    addon_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    addon_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    rate DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Failed to ensure facility_addons table exists:', err);
  }
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

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

app.get('/api/addons', (req, res) => {
  const { status } = req.query;

  const sql = status
    ? `SELECT addon_id, addon_name, description, rate, unit_type, status, created_at, updated_at FROM facility_addons WHERE LOWER(TRIM(status)) = LOWER(TRIM(?)) ORDER BY addon_name ASC`
    : `SELECT addon_id, addon_name, description, rate, unit_type, status, created_at, updated_at FROM facility_addons ORDER BY addon_name ASC`;

  const params = status ? [status] : [];

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Failed to query facility add-ons:', err);
      return res.status(500).json({ error: 'Failed to load facility add-ons' });
    }

    res.json(Array.isArray(results) ? results : []);
  });
});

app.get('/api/addons/:id', (req, res) => {
  const sql = `SELECT addon_id, addon_name, description, rate, unit_type, status FROM facility_addons WHERE addon_id = ? LIMIT 1`;

  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Failed to fetch add-on:', err);
      return res.status(500).json({ error: 'Failed to fetch add-on' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Add-on not found' });
    }

    res.json(results[0]);
  });
});

app.post('/api/addons', (req, res) => {
  const addon_name = String(req.body.addon_name || '').trim();
  const description = String(req.body.description || '').trim();
  const rate = Number(req.body.rate);
  const unit_type = String(req.body.unit_type || '').trim();
  const status = String(req.body.status || 'Active').trim() || 'Active';

  if (!addon_name || !unit_type || Number.isNaN(rate)) {
    return res.status(400).json({ success: false, message: 'Complete all required fields' });
  }

  const sql = `
    INSERT INTO facility_addons (addon_name, description, rate, unit_type, status)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [addon_name, description, rate, unit_type, status], (err, result) => {
    if (err) {
      console.error('Failed to create add-on:', err);
      return res.status(500).json({ success: false, message: 'Failed to create add-on' });
    }

    res.json({ success: true, addon_id: result.insertId });
  });
});

app.put('/api/addons/:id', (req, res) => {
  const addon_name = String(req.body.addon_name || '').trim();
  const description = String(req.body.description || '').trim();
  const rate = Number(req.body.rate);
  const unit_type = String(req.body.unit_type || '').trim();
  const status = String(req.body.status || 'Active').trim() || 'Active';

  if (!addon_name || !unit_type || Number.isNaN(rate)) {
    return res.status(400).json({ success: false, message: 'Complete all required fields' });
  }

  const sql = `
    UPDATE facility_addons
    SET addon_name = ?, description = ?, rate = ?, unit_type = ?, status = ?
    WHERE addon_id = ?
  `;

  db.query(sql, [addon_name, description, rate, unit_type, status, req.params.id], (err) => {
    if (err) {
      console.error('Failed to update add-on:', err);
      return res.status(500).json({ success: false, message: 'Failed to update add-on' });
    }

    res.json({ success: true });
  });
});

app.delete('/api/addons/:id', (req, res) => {
  db.query('DELETE FROM facility_addons WHERE addon_id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('Failed to delete add-on:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete add-on' });
    }

    res.json({ success: true });
  });
});

 app.post('/api/login', (req, res) => {
  const { user_name, password } = req.body;

  return res.status(401).json({
    success: false,
    message: 'Incorrect username or password'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
