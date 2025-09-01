const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const router = express.Router();

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
        message: 'يرجى إدخال اسم المستخدم وكلمة المرور'
      });
    }

    // البحث في جدول المستخدمين
    let user = null;
    let searchQuery = '';

    // البحث برقم الهوية للمرضى
    const patientQuery = `
      SELECT id, name, username, password_hash, phone, role, level, department_id, verified 
      FROM users 
      WHERE id = $1 AND role = 'patient' AND verified = true
    `;
    const patientResult = await query(patientQuery, [username]);

    if (patientResult.rows.length > 0) {
      user = patientResult.rows[0];
    } else {
      // البحث باسم المستخدم للموظفين والإدارة
      const staffQuery = `
        SELECT u.id, u.name, u.username, u.password_hash, u.phone, u.role, u.level, 
               u.department_id, u.verified, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.username = $1 AND u.role IN ('staff', 'supervisor', 'manager', 'admin')
      `;
      const staffResult = await query(staffQuery, [username]);
      
      if (staffResult.rows.length > 0) {
        user = staffResult.rows[0];
      }
    }

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    // التحقق من كلمة المرور
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    // إنشاء JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role,
        level: user.level
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    // إنشاء refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET + 'refresh',
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    // تسجيل عملية الدخول في السجل
    await query(
      `INSERT INTO system_logs (user_id, action, details, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        'login',
        JSON.stringify({ success: true, role: user.role }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    // إرسال الاستجابة بدون كلمة المرور
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تسجيل مريض جديد
router.post('/register', async (req, res) => {
  try {
    const { name, nationalId, phone, password } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !nationalId || !phone || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'جميع الحقول مطلوبة'
      });
    }

    // التحقق من صحة رقم الهوية
    if (nationalId.length !== 10 || !/^\d+$/.test(nationalId)) {
      return res.status(400).json({
        error: 'Invalid national ID',
        message: 'رقم الهوية يجب أن يكون 10 أرقام'
      });
    }

    // التحقق من صحة رقم الجوال
    if (!/^05\d{8}$/.test(phone)) {
      return res.status(400).json({
        error: 'Invalid phone number',
        message: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام'
      });
    }

    // التحقق من عدم وجود المستخدم مسبقاً
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [nationalId]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'رقم الهوية مسجل مسبقاً'
      });
    }

    // تشفير كلمة المرور
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // إدخال المستخدم الجديد
    await query(
      `INSERT INTO users (id, name, password_hash, phone, role, verified) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nationalId, name, hashedPassword, phone, 'patient', true]
    );

    // تسجيل عملية التسجيل في السجل
    await query(
      `INSERT INTO system_logs (user_id, action, details, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        nationalId,
        'register',
        JSON.stringify({ name, phone }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: nationalId,
        name,
        phone,
        role: 'patient',
        verified: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تجديد التوكن
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'رمز التجديد مطلوب'
      });
    }

    // التحقق من صحة refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET + 'refresh');
    
    // البحث عن المستخدم
    const userResult = await query(
      `SELECT id, name, username, role, level, department_id, verified 
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'رمز التجديد غير صحيح'
      });
    }

    const user = userResult.rows[0];

    // إنشاء access token جديد
    const newToken = jwt.sign(
      { 
        userId: user.id,
        role: user.role,
        level: user.level
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      user
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid refresh token',
      message: 'رمز التجديد غير صحيح'
    });
  }
});

// تسجيل الخروج
router.post('/logout', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // تسجيل عملية الخروج في السجل
        await query(
          `INSERT INTO system_logs (user_id, action, details, ip_address, user_agent) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            decoded.userId,
            'logout',
            JSON.stringify({ timestamp: new Date().toISOString() }),
            req.ip,
            req.get('User-Agent')
          ]
        );
      } catch (err) {
        // Token غير صحيح، لكن لا نريد إرجاع خطأ
      }
    }

    res.json({
      message: 'Logout successful',
      message_ar: 'تم تسجيل الخروج بنجاح'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// التحقق من صحة التوكن
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'لم يتم توفير رمز المصادقة'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // البحث عن المستخدم
    const userResult = await query(
      `SELECT u.id, u.name, u.username, u.phone, u.role, u.level, 
              u.department_id, u.verified, d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      message: 'Token is valid',
      user: userResult.rows[0]
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'رمز المصادقة غير صحيح'
    });
  }
});

module.exports = router;