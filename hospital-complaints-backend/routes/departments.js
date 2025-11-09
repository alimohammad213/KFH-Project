const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// جلب جميع الأقسام
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.*,
        COUNT(c.id) as complaints_count,
        COUNT(CASE WHEN c.status = 'تم الحل' THEN 1 END) as resolved_count
      FROM departments d
      LEFT JOIN complaints c ON d.id = c.department_id
      GROUP BY d.id, d.name, d.description, d.created_at
      ORDER BY d.name
    `);

    res.json({
      departments: result.rows.map(dept => ({
        ...dept,
        complaints_count: parseInt(dept.complaints_count) || 0,
        resolved_count: parseInt(dept.resolved_count) || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'حدث خطأ في جلب الأقسام'
    });
  }
});

// إضافة قسم جديد
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'Department name is required',
        message: 'اسم القسم مطلوب'
      });
    }

    // التحقق من عدم تكرار اسم القسم
    const existingDept = await query(
      'SELECT id FROM departments WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (existingDept.rows.length > 0) {
      return res.status(409).json({
        error: 'Department already exists',
        message: 'اسم القسم موجود مسبقاً'
      });
    }

    const result = await query(
      'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim(), description?.trim() || null]
    );

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'create_department',
      'department',
      result.rows[0].id,
      JSON.stringify({ name: name.trim(), description: description?.trim() })
    ]);

    res.status(201).json({
      message: 'Department created successfully',
      message_ar: 'تم إضافة القسم بنجاح',
      department: {
        ...result.rows[0],
        complaints_count: 0,
        resolved_count: 0
      }
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'حدث خطأ في إضافة القسم'
    });
  }
});

// تعديل قسم
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'Department name is required',
        message: 'اسم القسم مطلوب'
      });
    }

    // التحقق من وجود القسم
    const existingDept = await query('SELECT * FROM departments WHERE id = $1', [id]);
    if (existingDept.rows.length === 0) {
      return res.status(404).json({
        error: 'Department not found',
        message: 'القسم غير موجود'
      });
    }

    // التحقق من عدم تكرار اسم القسم
    const duplicateDept = await query(
      'SELECT id FROM departments WHERE LOWER(name) = LOWER($1) AND id != $2',
      [name.trim(), id]
    );

    if (duplicateDept.rows.length > 0) {
      return res.status(409).json({
        error: 'Department name already exists',
        message: 'اسم القسم موجود مسبقاً'
      });
    }

    const result = await query(
      'UPDATE departments SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name.trim(), description?.trim() || null, id]
    );

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'update_department',
      'department',
      id,
      JSON.stringify({ 
        old_name: existingDept.rows[0].name,
        new_name: name.trim(),
        description: description?.trim()
      })
    ]);

    // جلب الإحصائيات
    const statsResult = await query(`
      SELECT 
        COUNT(c.id) as complaints_count,
        COUNT(CASE WHEN c.status = 'تم الحل' THEN 1 END) as resolved_count
      FROM complaints c
      WHERE c.department_id = $1
    `, [id]);

    const stats = statsResult.rows[0];

    res.json({
      message: 'Department updated successfully',
      message_ar: 'تم تحديث القسم بنجاح',
      department: {
        ...result.rows[0],
        complaints_count: parseInt(stats.complaints_count) || 0,
        resolved_count: parseInt(stats.resolved_count) || 0
      }
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'حدث خطأ في تحديث القسم'
    });
  }
});

// حذف قسم
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من وجود القسم
    const existingDept = await query('SELECT * FROM departments WHERE id = $1', [id]);
    if (existingDept.rows.length === 0) {
      return res.status(404).json({
        error: 'Department not found',
        message: 'القسم غير موجود'
      });
    }

    // التحقق من وجود شكاوى في القسم
    const complaintsResult = await query(
      'SELECT COUNT(*) as count FROM complaints WHERE department_id = $1',
      [id]
    );
    
    if (parseInt(complaintsResult.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Department has complaints',
        message: 'لا يمكن حذف القسم لأنه يحتوي على شكاوى'
      });
    }

    // التحقق من وجود موظفين في القسم
    const staffResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE department_id = $1',
      [id]
    );
    
    if (parseInt(staffResult.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Department has staff',
        message: 'لا يمكن حذف القسم لأنه يحتوي على موظفين'
      });
    }

    // حذف القسم
    await query('DELETE FROM departments WHERE id = $1', [id]);

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'delete_department',
      'department',
      id,
      JSON.stringify({ 
        name: existingDept.rows[0].name,
        description: existingDept.rows[0].description
      })
    ]);

    res.json({
      message: 'Department deleted successfully',
      message_ar: 'تم حذف القسم بنجاح'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'حدث خطأ في حذف القسم'
    });
  }
});

module.exports = router;