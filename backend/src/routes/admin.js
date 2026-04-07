const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/jobs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ops.etl_job_runs ORDER BY started_at DESC LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/data-quality/issues', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ops.data_quality_issues ORDER BY detected_at DESC LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users', requireRole('SYS_ADMIN', 'HQ_ADMIN'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.status, u.last_login_at, u.created_at,
        ARRAY_AGG(r.role_code) as roles, ARRAY_AGG(r.role_name) as role_names
       FROM app_auth.users u
       LEFT JOIN app_auth.user_roles ur ON u.user_id = ur.user_id
       LEFT JOIN app_auth.roles r ON ur.role_id = r.role_id
       GROUP BY u.user_id ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/db-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT schemaname, relname as table_name, n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE schemaname IN ('app_auth','app_core','dw','mart','ops','audit')
      ORDER BY schemaname, relname
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
