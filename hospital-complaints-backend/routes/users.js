const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// جلب جميع الموظفين
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.phone,
        u.role,
        u.level,
        u.department_id,
        u.verified,
        d.name as department_name,
        COUNT(c.id) as assigned_complaints
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN complaints c ON u.id = c.assigned_to
      WHERE u.role IN ('staff', 'supervisor', 'manager')
      GROUP BY u.id, u.name, u.username, u.phone, u.role, u.level, u.department_id, u.verified, d.name
      ORDER BY u.role, u.name
    `);

    res.json({
      staff: result.rows.map(staff => ({
        ...staff,
        assigned_complaints: parseInt(staff.assigned_complaints) || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'حدث خطأ في جلب الموظفين'
    });
  }
});

// إضافة موظف جديد
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, username, password, department_id, role } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !username || !password || !department_id || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'جميع الحقول مطلوبة'
      });
    }

    // التحقق من صحة الدور
    if (!['staff', 'supervisor', 'manager'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'دور غير صحيح'
      });
    }

    // التحقق من وجود القسم
    const deptResult = await query('SELECT id FROM departments WHERE id = $1', [department_id]);
    if (deptResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Department not found',
        message: 'القسم غير موجود'
      });
    }

    // التحقق من عدم تكرار اسم المستخدم
    const existingUser = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'اسم المستخدم موجود مسبقاً'
      });
    }

    // تشفير كلمة المرور
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // تحديد المستوى حسب الدور
    const levelMap = {
      'staff': 1,
      'supervisor': 2,
      'manager': 3
    };

    // إنشاء معرف فريد للموظف
    const staffId = `${role}_${Date.now()}`;

    const result = await query(`
      INSERT INTO users (id, name, username, password_hash, role, level, department_id, verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, username, role, level, department_id, verified
    `, [
      staffId,
      name.trim(),
      username.trim(),
      hashedPassword,
      role,
      levelMap[role],
      department_id,
      true
    ]);

    // جلب اسم القسم
    const deptName = await query('SELECT name FROM departments WHERE id = $1', [department_id]);

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'create_staff',
      'user',
      staffId,
      JSON.stringify({ 
        name: name.trim(),
        username: username.trim(),
        role,
        department: deptName.rows[0]?.name
      })
    ]);

    res.status(201).json({
      message: 'Staff member created successfully',
      message_ar: 'تم إضافة الموظف بنجاح',
      staff: {
        ...result.rows[0],
        department_name: deptName.rows[0]?.name,
        assigned_complaints: 0
      }
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'حدث خطأ في إضافة الموظف'
    });
  }
});

// تعديل بيانات موظف
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, department_id, role } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !username || !department_id || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'الحقول المطلوبة مفقودة'
      });
    }

    // التحقق من وجود الموظف
    const existingUser = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'الموظف غير موجود'
      });
    }

    // التحقق من صحة الدور
    if (!['staff', 'supervisor', 'manager'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'دور غير صحيح'
      });
    }

    // التحقق من وجود القسم
    const deptResult = await query('SELECT id FROM departments WHERE id = $1', [department_id]);
    if (deptResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Department not found',
        message: 'القسم غير موجود'
      });
    }

    // التحقق من عدم تكرار اسم المستخدم
    const duplicateUser = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2', 
      [username, id]
    );
    if (duplicateUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'اسم المستخدم موجود مسبقاً'
      });
    }

    // تحديد المستوى حسب الدور
    const levelMap = {
      'staff': 1,
      'supervisor': 2,
      'manager': 3
    };

    let updateQuery = `
      UPDATE users 
      SET name = $1, username = $2, role = $3, level = $4, department_id = $5
      WHERE id = $6
      RETURNING id, name, username, role, level, department_id, verified
    `;
    let updateParams = [name.trim(), username.trim(), role, levelMap[role], department_id, id];

    // إذا تم إرسال كلمة مرور جديدة
    if (password && password.trim()) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      updateQuery = `
        UPDATE users 
        SET name = $1, username = $2, password_hash = $3, role = $4, level = $5, department_id = $6
        WHERE id = $7
        RETURNING id, name, username, role, level, department_id, verified
      `;
      updateParams = [name.trim(), username.trim(), hashedPassword, role, levelMap[role], department_id, id];
    }

    const result = await query(updateQuery, updateParams);

    // جلب اسم القسم
    const deptName = await query('SELECT name FROM departments WHERE id = $1', [department_id]);

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'update_staff',
      'user',
      id,
      JSON.stringify({ 
        old_name: existingUser.rows[0].name,
        new_name: name.trim(),
        old_role: existingUser.rows[0].role,
        new_role: role,
        password_changed: !!password?.trim()
      })
    ]);

    // جلب عدد الشكاوى المعينة
    const complaintsResult = await query(
      'SELECT COUNT(*) as count FROM complaints WHERE assigned_to = $1',
      [id]
    );

    res.json({
      message: 'Staff member updated successfully',
      message_ar: 'تم تحديث بيانات الموظف بنجاح',
      staff: {
        ...result.rows[0],
        department_name: deptName.rows[0]?.name,
        assigned_complaints: parseInt(complaintsResult.rows[0].count) || 0
      }
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'حدث خطأ في تحديث الموظف'
    });
  }
});

// حذف موظف
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من وجود الموظف
    const existingUser = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'الموظف غير موجود'
      });
    }

    // التحقق من وجود شكاوى معينة للموظف
    const complaintsResult = await query(
      'SELECT COUNT(*) as count FROM complaints WHERE assigned_to = $1',
      [id]
    );
    
    if (parseInt(complaintsResult.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Staff has assigned complaints',
        message: `لا يمكن حذف الموظف لأن لديه ${complaintsResult.rows[0].count} شكوى معينة إليه`
      });
    }

    // حذف الموظف
    await query('DELETE FROM users WHERE id = $1', [id]);

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'delete_staff',
      'user',
      id,
      JSON.stringify({ 
        name: existingUser.rows[0].name,
        username: existingUser.rows[0].username,
        role: existingUser.rows[0].role
      })
    ]);

    res.json({
      message: 'Staff member deleted successfully',
      message_ar: 'تم حذف الموظف بنجاح'
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'حدث خطأ في حذف الموظف'
    });
  }
});

// تبديل حالة تفعيل الموظف
router.patch('/:id/toggle-status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من وجود الموظف
    const existingUser = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'الموظف غير موجود'
      });
    }

    const newStatus = !existingUser.rows[0].verified;

    const result = await query(
      'UPDATE users SET verified = $1 WHERE id = $2 RETURNING *',
      [newStatus, id]
    );

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      newStatus ? 'activate_staff' : 'deactivate_staff',
      'user',
      id,
      JSON.stringify({ 
        name: existingUser.rows[0].name,
        old_status: existingUser.rows[0].verified,
        new_status: newStatus
      })
    ]);

    res.json({
      message: `Staff member ${newStatus ? 'activated' : 'deactivated'} successfully`,
      message_ar: `تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} الموظف بنجاح`,
      staff: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling staff status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'حدث خطأ في تغيير حالة الموظف'
    });
  }
});

module.exports = router;