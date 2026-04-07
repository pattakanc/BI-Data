const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const userResult = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.password_hash, u.status, u.avatar_url
       FROM app_auth.users u WHERE u.username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const rolesResult = await pool.query(
      `SELECT r.role_code, r.role_name, r.role_group
       FROM app_auth.user_roles ur
       JOIN app_auth.roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1`,
      [user.user_id]
    );
    const roles = rolesResult.rows.map(r => r.role_code);
    const roleNames = rolesResult.rows.map(r => r.role_name);

    const scopesResult = await pool.query(
      `SELECT scope_type, scope_code FROM app_auth.user_data_scopes WHERE user_id = $1 AND is_active = true`,
      [user.user_id]
    );
    const scopes = scopesResult.rows;

    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      fullName: user.full_name,
      roles,
      scopes,
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    const refreshToken = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

    await pool.query('UPDATE app_auth.users SET last_login_at = now() WHERE user_id = $1', [user.user_id]);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
          roles,
          roleNames,
          scopes,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const userResult = await pool.query(
      `SELECT u.user_id, u.username, u.full_name FROM app_auth.users u WHERE u.user_id = $1 AND u.status = 'ACTIVE'`,
      [decoded.userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'User not found or inactive' });
    }

    const user = userResult.rows[0];
    const rolesResult = await pool.query(
      `SELECT r.role_code FROM app_auth.user_roles ur JOIN app_auth.roles r ON ur.role_id = r.role_id WHERE ur.user_id = $1`,
      [user.user_id]
    );
    const roles = rolesResult.rows.map(r => r.role_code);

    const scopesResult = await pool.query(
      `SELECT scope_type, scope_code FROM app_auth.user_data_scopes WHERE user_id = $1 AND is_active = true`,
      [user.user_id]
    );

    const tokenPayload = { userId: user.user_id, username: user.username, fullName: user.full_name, roles, scopes: scopesResult.rows };
    const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid refresh token' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.avatar_url, u.status, u.last_login_at
       FROM app_auth.users u WHERE u.user_id = $1`,
      [req.user.userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];
    res.json({
      success: true,
      data: {
        ...user,
        roles: req.user.roles,
        scopes: req.user.scopes,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อผู้ใช้และอีเมล' });
    }

    const userResult = await pool.query(
      `SELECT user_id, username, email, full_name FROM app_auth.users WHERE username = $1 AND status = 'ACTIVE'`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
    }

    const user = userResult.rows[0];
    if (user.email !== email) {
      return res.status(400).json({ success: false, message: 'อีเมลไม่ตรงกับบัญชีผู้ใช้' });
    }

    // Generate temporary password
    const tempPassword = 'Reset@' + Math.random().toString(36).slice(-6);
    const hash = await bcrypt.hash(tempPassword, 10);
    await pool.query('UPDATE app_auth.users SET password_hash = $1 WHERE user_id = $2', [hash, user.user_id]);

    res.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ',
      data: { tempPassword, fullName: user.full_name },
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
    }

    const userResult = await pool.query(
      'SELECT password_hash FROM app_auth.users WHERE user_id = $1',
      [req.user.userId]
    );
    const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE app_auth.users SET password_hash = $1 WHERE user_id = $2', [hash, req.user.userId]);

    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
