// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const filmsRouter = require('./routes/films');
const pool = require('./db'); // optional: for the startup DB check below

const app = express();

// allow React dev server during development
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// mount routes
app.use('/api/films', filmsRouter);

// 404 (optional but nice)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));

// OPTIONAL: startup DB check (shows real connection errors immediately)
(async () => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('Database connection OK:', rows[0]);
  } catch (err) {
    console.error('Database connection FAILED:', err);
  }
})();
