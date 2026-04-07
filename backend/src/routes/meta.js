const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/branches', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT branch_key, branch_code, branch_name, region_code, region_name, branch_type, province
       FROM dw.dim_branch WHERE is_current = true AND active_flag = true ORDER BY branch_name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/regions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT region_code, region_name FROM dw.dim_branch WHERE is_current = true ORDER BY region_name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT product_key, product_code, product_name, category_code, category_name, brand_name
       FROM dw.dim_product WHERE is_current = true AND active_flag = true ORDER BY product_name LIMIT 200`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/customers/segments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT segment_code, COUNT(*) as count FROM dw.dim_customer WHERE is_current = true GROUP BY segment_code ORDER BY count DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/employees', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT employee_key, employee_code, employee_name, branch_code, position_name
       FROM dw.dim_employee WHERE is_current = true AND employment_status = 'ACTIVE' ORDER BY employee_name LIMIT 200`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
