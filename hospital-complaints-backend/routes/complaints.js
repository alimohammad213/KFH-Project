const express = require('express');
const { query } = require('../config/database');
const { 
  authenticateToken, 
  requireRole, 
  requireOwnership 
} = require('../middleware/auth');
const router = express.Router();

// إنشاء شكوى جديدة (للمرضى)
router.post('/', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const { department_id, subject, description, priority = 'متوسط' } = req.body;
    const patient_id = req.user.id;

    // التحقق من البيانات المطلوبة
    if (!department_id || !subject || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'القسم والموضوع والوصف مطلوبة'
      });
    }

    // التحقق من وجود القسم
    const departmentResult = await query(
      'SELECT id, name FROM departments WHERE id = $1',
      [department_id]
    );

    if (departmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Department not found',
        message: 'القسم المحدد غير موجود'
      });
    }

    // إنشاء معرف فريد للشكوى
    const complaintId = `CMP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // إدراج الشكوى الجديدة
    const complaintResult = await query(`
      INSERT INTO complaints (id, patient_id, department_id, subject, description, status, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [complaintId, patient_id, department_id, subject, description, 'جديدة', priority]);
// بعد سطر:
// `, [complaintId, patient_id, department_id, subject, description, 'جديدة', priority]);

// أضف هذا الكود:
// التعيين التلقائي لأول موظف متاح في القسم
const staffResult = await query(
  `SELECT id, name FROM users 
   WHERE department_id = $1 AND role IN ('staff', 'supervisor') 
   LIMIT 1`,
  [department_id]
);

if (staffResult.rows.length > 0) {
  const assignedStaff = staffResult.rows[0];
  
  // تحديث الشكوى لتعيينها للموظف
  await query(
    'UPDATE complaints SET assigned_to = $1 WHERE id = $2',
    [assignedStaff.id, complaintId]
  );

  // إضافة سجل في التايم لاين
  await query(`
    INSERT INTO complaint_timeline (complaint_id, status, note, updated_by)
    VALUES ($1, $2, $3, $4)
  `, [complaintId, 'تم التعيين', `تم تعيين الشكوى تلقائياً للموظف: ${assignedStaff.name}`, patient_id]);
}
    // إضافة سجل في التايم لاين
    await query(`
      INSERT INTO complaint_timeline (complaint_id, status, note, updated_by)
      VALUES ($1, $2, $3, $4)
    `, [complaintId, 'جديدة', 'تم إنشاء الشكوى', patient_id]);

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      patient_id,
      'create_complaint',
      'complaint',
      complaintId,
      JSON.stringify({ 
        department_id, 
        subject: subject.substring(0, 50),
        priority 
      })
    ]);

    // الحصول على تفاصيل الشكوى مع اسم القسم
    const complaintDetails = await query(`
      SELECT c.*, d.name as department_name, u.name as patient_name
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      JOIN users u ON c.patient_id = u.id
      WHERE c.id = $1
    `, [complaintId]);

    res.status(201).json({
      message: 'Complaint created successfully',
      message_ar: 'تم إنشاء الشكوى بنجاح',
      complaint: complaintDetails.rows[0]
    });

  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// عرض جميع الشكاوى (حسب الدور والصلاحيات)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      department_id, 
      priority, 
      page = 1, 
      limit = 20,
      search,
      assigned_to 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // بناء شروط الاستعلام حسب دور المستخدم
    if (req.user.role === 'patient') {
      // المرضى يرون شكاواهم فقط
      whereConditions.push(`c.patient_id = $${++paramCount}`);
      queryParams.push(req.user.id);
    } else if (req.user.role === 'staff') {
      // الموظفين يرون شكاوى قسمهم فقط
      whereConditions.push(`c.department_id = $${++paramCount}`);
      queryParams.push(req.user.department_id);
    } else if (['supervisor', 'manager'].includes(req.user.role)) {
      // المشرفين والمدراء يرون شكاوى قسمهم
      whereConditions.push(`c.department_id = $${++paramCount}`);
      queryParams.push(req.user.department_id);
    }
    // الإدارة ترى جميع الشكاوى (لا نضيف شروط)

    // فلترة حسب الحالة
    if (status) {
      whereConditions.push(`c.status = $${++paramCount}`);
      queryParams.push(status);
    }

    // فلترة حسب القسم (للإدارة)
    if (department_id && req.user.role === 'admin') {
      whereConditions.push(`c.department_id = $${++paramCount}`);
      queryParams.push(department_id);
    }

    // فلترة حسب الأولوية
    if (priority) {
      whereConditions.push(`c.priority = $${++paramCount}`);
      queryParams.push(priority);
    }

    // فلترة حسب المعين إليه
    if (assigned_to) {
      whereConditions.push(`c.assigned_to = $${++paramCount}`);
      queryParams.push(assigned_to);
    }

    // البحث النصي
    if (search) {
      whereConditions.push(`(c.subject ILIKE $${++paramCount} OR c.description ILIKE $${++paramCount})`);
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // استعلام العدد الإجمالي
    const countQuery = `
      SELECT COUNT(*) as total
      FROM complaints c
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const totalComplaints = parseInt(countResult.rows[0].total);

    // استعلام البيانات مع الصفحات
    const dataQuery = `
      SELECT 
        c.*,
        d.name as department_name,
        p.name as patient_name,
        a.name as assigned_to_name
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      JOIN users p ON c.patient_id = p.id
      LEFT JOIN users a ON c.assigned_to = a.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    queryParams.push(parseInt(limit), offset);
    const complaintsResult = await query(dataQuery, queryParams);

    res.json({
      complaints: complaintsResult.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalComplaints / parseInt(limit)),
        total_complaints: totalComplaints,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// عرض شكاوى المستخدم الحالي
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let complaintsQuery = '';
    let queryParams = [userId];

    if (req.user.role === 'patient') {
      // المرضى يرون شكاواهم
      complaintsQuery = `
        SELECT 
          c.*,
          d.name as department_name,
          a.name as assigned_to_name
        FROM complaints c
        JOIN departments d ON c.department_id = d.id
        LEFT JOIN users a ON c.assigned_to = a.id
        WHERE c.patient_id = $1
        ORDER BY c.created_at DESC
      `;
    } else {
      // الموظفين يرون الشكاوى المعينة إليهم
      complaintsQuery = `
        SELECT 
          c.*,
          d.name as department_name,
          p.name as patient_name
        FROM complaints c
        JOIN departments d ON c.department_id = d.id
        JOIN users p ON c.patient_id = p.id
        WHERE c.assigned_to = $1
        ORDER BY c.created_at DESC
      `;
    }

    const result = await query(complaintsQuery, queryParams);

    res.json({
      complaints: result.rows
    });

  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// عرض تفاصيل شكوى واحدة
router.get('/:id', authenticateToken, requireOwnership('complaintId'), async (req, res) => {
  try {
    const complaintId = req.params.id;

    // استعلام تفاصيل الشكوى
    const complaintQuery = `
      SELECT 
        c.*,
        d.name as department_name,
        p.name as patient_name,
        p.phone as patient_phone,
        a.name as assigned_to_name
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      JOIN users p ON c.patient_id = p.id
      LEFT JOIN users a ON c.assigned_to = a.id
      WHERE c.id = $1
    `;

    const complaintResult = await query(complaintQuery, [complaintId]);

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Complaint not found',
        message: 'الشكوى غير موجودة'
      });
    }

    // استعلام التايم لاين
    const timelineQuery = `
      SELECT 
        ct.*,
        u.name as updated_by_name
      FROM complaint_timeline ct
      LEFT JOIN users u ON ct.updated_by = u.id
      WHERE ct.complaint_id = $1
      ORDER BY ct.timestamp DESC
    `;

    const timelineResult = await query(timelineQuery, [complaintId]);

    // استعلام المرفقات
    const attachmentsQuery = `
      SELECT 
        a.*,
        u.name as uploaded_by_name
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.complaint_id = $1
      ORDER BY a.uploaded_at DESC
    `;

    const attachmentsResult = await query(attachmentsQuery, [complaintId]);

    res.json({
      complaint: complaintResult.rows[0],
      timeline: timelineResult.rows,
      attachments: attachmentsResult.rows
    });

  } catch (error) {
    console.error('Get complaint details error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تحديث حالة الشكوى (للموظفين والإدارة)
router.put('/:id/status', authenticateToken, requireRole(['staff', 'supervisor', 'manager', 'admin']), async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { status, note } = req.body;
    const updatedBy = req.user.id;

    // التحقق من صحة الحالة
    const validStatuses = ['جديدة', 'تحت المراجعة', 'قيد المعالجة', 'تم الحل', 'مرفوضة', 'متصعدة'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'حالة غير صحيحة',
        valid_statuses: validStatuses
      });
    }

    // التحقق من وجود الشكوى وصلاحية التعديل
    const complaintResult = await query(
      'SELECT * FROM complaints WHERE id = $1',
      [complaintId]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Complaint not found',
        message: 'الشكوى غير موجودة'
      });
    }

    const complaint = complaintResult.rows[0];

    // التحقق من صلاحية الموظف لتعديل الشكوى
    if (req.user.role !== 'admin' && req.user.department_id !== complaint.department_id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'ليس لديك صلاحية لتعديل هذه الشكوى'
      });
    }

    // تحديث حالة الشكوى
    await query(
      'UPDATE complaints SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, complaintId]
    );

    // إضافة سجل في التايم لاين
    await query(`
      INSERT INTO complaint_timeline (complaint_id, status, note, updated_by)
      VALUES ($1, $2, $3, $4)
    `, [complaintId, status, note || null, updatedBy]);

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      updatedBy,
      'update_complaint_status',
      'complaint',
      complaintId,
      JSON.stringify({ 
        old_status: complaint.status,
        new_status: status,
        note: note?.substring(0, 100)
      })
    ]);

    res.json({
      message: 'Status updated successfully',
      message_ar: 'تم تحديث الحالة بنجاح',
      complaint_id: complaintId,
      new_status: status
    });

  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تعيين الشكوى لموظف
router.put('/:id/assign', authenticateToken, requireRole(['supervisor', 'manager', 'admin']), async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { assigned_to } = req.body;
    const assignedBy = req.user.id;

    // التحقق من وجود الشكوى
    const complaintResult = await query(
      'SELECT * FROM complaints WHERE id = $1',
      [complaintId]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Complaint not found',
        message: 'الشكوى غير موجودة'
      });
    }

    const complaint = complaintResult.rows[0];

    // التحقق من صلاحية التعيين
    if (req.user.role !== 'admin' && req.user.department_id !== complaint.department_id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'ليس لديك صلاحية لتعيين هذه الشكوى'
      });
    }

    // إذا كان assigned_to فارغ، إلغاء التعيين
    if (!assigned_to) {
      await query(
        'UPDATE complaints SET assigned_to = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [complaintId]
      );

      await query(`
        INSERT INTO complaint_timeline (complaint_id, status, note, updated_by)
        VALUES ($1, $2, $3, $4)
      `, [complaintId, 'تم إلغاء التعيين', 'تم إلغاء تعيين الشكوى', assignedBy]);

      return res.json({
        message: 'Assignment cleared successfully',
        message_ar: 'تم إلغاء التعيين بنجاح'
      });
    }

    // التحقق من وجود الموظف المعين إليه
    const staffResult = await query(
      `SELECT id, name, role, department_id FROM users 
       WHERE id = $1 AND role IN ('staff', 'supervisor', 'manager')`,
      [assigned_to]
    );

    if (staffResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'الموظف المحدد غير موجود'
      });
    }

    const staff = staffResult.rows[0];

    // التحقق من أن الموظف في نفس القسم (إلا للإدارة)
    if (req.user.role !== 'admin' && staff.department_id !== complaint.department_id) {
      return res.status(400).json({
        error: 'Staff member not in complaint department',
        message: 'الموظف ليس في قسم الشكوى'
      });
    }

    // تعيين الشكوى
    await query(
      'UPDATE complaints SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [assigned_to, complaintId]
    );

    // إضافة سجل في التايم لاين
    await query(`
      INSERT INTO complaint_timeline (complaint_id, status, note, updated_by)
      VALUES ($1, $2, $3, $4)
    `, [complaintId, 'تم التعيين', `تم تعيين الشكوى إلى ${staff.name}`, assignedBy]);

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      assignedBy,
      'assign_complaint',
      'complaint',
      complaintId,
      JSON.stringify({ 
        assigned_to,
        assigned_to_name: staff.name,
        old_assigned_to: complaint.assigned_to
      })
    ]);

    res.json({
      message: 'Complaint assigned successfully',
      message_ar: 'تم تعيين الشكوى بنجاح',
      assigned_to: staff.name
    });

  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// حذف شكوى (للإدارة فقط)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const complaintId = req.params.id;
    const deletedBy = req.user.id;

    // التحقق من وجود الشكوى
    const complaintResult = await query(
      'SELECT * FROM complaints WHERE id = $1',
      [complaintId]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Complaint not found',
        message: 'الشكوى غير موجودة'
      });
    }

    const complaint = complaintResult.rows[0];

    // حذف الشكوى (سيحذف التايم لاين والمرفقات تلقائياً بسبب CASCADE)
    await query('DELETE FROM complaints WHERE id = $1', [complaintId]);

    // تسجيل العملية في السجل
    await query(`
      INSERT INTO system_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      deletedBy,
      'delete_complaint',
      'complaint',
      complaintId,
      JSON.stringify({ 
        patient_id: complaint.patient_id,
        subject: complaint.subject.substring(0, 50),
        status: complaint.status
      })
    ]);

    res.json({
      message: 'Complaint deleted successfully',
      message_ar: 'تم حذف الشكوى بنجاح'
    });

  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

// إحصائيات الشكاوى
router.get('/stats/summary', authenticateToken, requireRole(['staff', 'supervisor', 'manager', 'admin']), async (req, res) => {
  try {
    let whereCondition = '';
    let queryParams = [];

    // فلترة حسب دور المستخدم
    if (req.user.role !== 'admin') {
      whereCondition = 'WHERE department_id = $1';
      queryParams.push(req.user.department_id);
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_complaints,
        COUNT(CASE WHEN status = 'جديدة' THEN 1 END) as new_complaints,
        COUNT(CASE WHEN status = 'تحت المراجعة' THEN 1 END) as under_review,
        COUNT(CASE WHEN status = 'قيد المعالجة' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'تم الحل' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'مرفوضة' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'متصعدة' THEN 1 END) as escalated,
        COUNT(CASE WHEN priority = 'عالي' THEN 1 END) as high_priority,
        COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned
      FROM complaints ${whereCondition}
    `;

    const statsResult = await query(statsQuery, queryParams);

    res.json({
      stats: statsResult.rows[0]
    });

  } catch (error) {
    console.error('Get complaints stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'حدث خطأ في الخادم'
    });
  }
});

module.exports = router;