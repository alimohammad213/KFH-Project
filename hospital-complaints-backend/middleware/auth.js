const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware للتحقق من صحة JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'رمز المصادقة مطلوب للوصول'
      });
    }

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // البحث عن المستخدم في قاعدة البيانات
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

    const user = userResult.rows[0];

    // التحقق من أن المستخدم نشط
    if (user.role === 'patient' && !user.verified) {
      return res.status(401).json({
        error: 'Account not verified',
        message: 'الحساب غير مفعل'
      });
    }

    // إضافة معلومات المستخدم إلى الطلب
    req.user = user;
    req.tokenData = decoded;
    
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'رمز المصادقة غير صحيح'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'انتهت صلاحية رمز المصادقة',
        expired: true
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'خطأ في المصادقة'
    });
  }
};

// Middleware للتحقق من الأدوار
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'المصادقة مطلوبة'
      });
    }

    const userRole = req.user.role;
    
    // السماح للإدارة بالوصول لكل شيء
    if (userRole === 'admin') {
      return next();
    }

    // التحقق من الأدوار المسموحة
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'ليس لديك صلاحية للوصول',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Middleware للتحقق من مستوى المستخدم (للتصعيد الهرمي)
const requireLevel = (minimumLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'المصادقة مطلوبة'
      });
    }

    const userLevel = req.user.level || 1;
    
    if (userLevel < minimumLevel) {
      return res.status(403).json({
        error: 'Insufficient level',
        message: 'مستوى الصلاحية غير كافي',
        required: minimumLevel,
        current: userLevel
      });
    }

    next();
  };
};

// Middleware للتحقق من القسم (الموظفين يمكنهم الوصول لقسمهم فقط)
const requireSameDepartment = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'المصادقة مطلوبة'
    });
  }

  // الإدارة لديها وصول لجميع الأقسام
  if (req.user.role === 'admin') {
    return next();
  }

  const userDepartmentId = req.user.department_id;
  const targetDepartmentId = req.params.departmentId || req.body.department_id;

  if (targetDepartmentId && userDepartmentId !== parseInt(targetDepartmentId)) {
    return res.status(403).json({
      error: 'Department access denied',
      message: 'ليس لديك صلاحية للوصول لهذا القسم',
      userDepartment: userDepartmentId,
      targetDepartment: targetDepartmentId
    });
  }

  next();
};

// Middleware للتحقق من ملكية المورد (المريض يمكنه الوصول لشكاواه فقط)
const requireOwnership = (resourceKey = 'id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'المصادقة مطلوبة'
      });
    }

    // الإدارة والموظفين لديهم وصول واسع
    if (['admin', 'staff', 'supervisor', 'manager'].includes(req.user.role)) {
      return next();
    }

    // المرضى يمكنهم الوصول لمواردهم فقط
    if (req.user.role === 'patient') {
      const resourceId = req.params[resourceKey];
      
      if (resourceKey === 'id' && resourceId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'ليس لديك صلاحية للوصول لهذا المورد'
        });
      }

      // للشكاوى، نحتاج للتحقق من patient_id
      if (resourceKey === 'complaintId') {
        try {
          const complaintResult = await query(
            'SELECT patient_id FROM complaints WHERE id = $1',
            [resourceId]
          );

          if (complaintResult.rows.length === 0) {
            return res.status(404).json({
              error: 'Complaint not found',
              message: 'الشكوى غير موجودة'
            });
          }

          if (complaintResult.rows[0].patient_id !== req.user.id) {
            return res.status(403).json({
              error: 'Access denied',
              message: 'ليس لديك صلاحية للوصول لهذه الشكوى'
            });
          }
        } catch (error) {
          console.error('Ownership check error:', error);
          return res.status(500).json({
            error: 'Access verification failed',
            message: 'فشل في التحقق من الصلاحية'
          });
        }
      }
    }

    next();
  };
};

// Middleware اختياري للمصادقة (للـ endpoints العامة)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      `SELECT u.id, u.name, u.username, u.phone, u.role, u.level, 
              u.department_id, u.verified, d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    req.user = userResult.rows.length > 0 ? userResult.rows[0] : null;
    req.tokenData = decoded;
    
    next();

  } catch (error) {
    // في حالة المصادقة الاختيارية، نتجاهل الأخطاء
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireLevel,
  requireSameDepartment,
  requireOwnership,
  optionalAuth
};