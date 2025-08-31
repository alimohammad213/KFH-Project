export const initialData = {
  users: [
    { 
      id: '123456789', 
      name: 'أحمد محمد', 
      phone: '0501234567', 
      password: '123456', 
      role: 'patient', 
      verified: true,
      createdAt: new Date().toISOString()
    }
  ],
  
  staff: [
    // موظفين عاديين (مستوى 1)
    { 
      id: 'staff1', 
      name: 'د. سارة أحمد', 
      username: 'sara.ahmed', 
      password: 'staff123', 
      department: 'أشعة', 
      role: 'staff', 
      level: 1 
    },
    { 
      id: 'staff2', 
      name: 'أ. محمد علي', 
      username: 'mohamed.ali', 
      password: 'staff123', 
      department: 'طوارئ', 
      role: 'staff', 
      level: 1 
    },
    
    // مشرفين (مستوى 2)
    { 
      id: 'super1', 
      name: 'د. خالد الشمري', 
      username: 'khalid.supervisor', 
      password: 'super123', 
      department: 'أشعة', 
      role: 'supervisor', 
      level: 2 
    },
    { 
      id: 'super2', 
      name: 'د. فاطمة العتيبي', 
      username: 'fatima.supervisor', 
      password: 'super123', 
      department: 'طوارئ', 
      role: 'supervisor', 
      level: 2 
    },
    
    // مديرين (مستوى 3)
    { 
      id: 'dm1', 
      name: 'د. نورا المالكي', 
      username: 'nora.manager', 
      password: 'mgr123', 
      department: 'أشعة', 
      role: 'manager', 
      level: 3 
    },
    { 
      id: 'dm2', 
      name: 'د. سعد الغامدي', 
      username: 'saad.manager', 
      password: 'mgr123', 
      department: 'طوارئ', 
      role: 'manager', 
      level: 3 
    },
    
    // موظفين إضافيين في الأقسام الأخرى
    { 
      id: 'staff3', 
      name: 'أ. عبدالله الأحمد', 
      username: 'abdullah.lab', 
      password: 'staff123', 
      department: 'المختبر', 
      role: 'staff', 
      level: 1 
    },
    { 
      id: 'staff4', 
      name: 'د. لينا القحطاني', 
      username: 'lina.pharmacy', 
      password: 'staff123', 
      department: 'الصيدلية', 
      role: 'staff', 
      level: 1 
    }
  ],
  
  admins: [
    { 
      id: 'admin1', 
      username: 'admin', 
      password: 'admin123', 
      name: 'مدير النظام', 
      role: 'admin', 
      level: 4 
    }
  ],
  
  departments: [
    'أشعة', 
    'طوارئ', 
    'مواعيد', 
    'المختبر', 
    'الصيدلية', 
    'الاستقبال'
  ],
  
  // بيانات تجريبية للشكاوى
  complaints: [
    {
      id: 'comp1',
      patientId: '123456789',
      patientName: 'أحمد محمد',
      patientPhone: '0501234567',
      department: 'أشعة',
      subject: 'تأخير في نتائج الأشعة',
      description: 'لم أحصل على نتائج الأشعة المقطعية التي تم إجراؤها منذ 3 أيام. تم إخباري أنها ستكون جاهزة خلال يومين فقط.',
      status: 'تحت المراجعة',
      assignedTo: 'staff1',
      escalated: false,
      escalationLevel: 1,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // قبل يومين
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        {
          status: 'جديدة',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          note: 'تم استلام الشكوى'
        },
        {
          status: 'تحت المراجعة',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          note: 'تم تعيين الشكوى للموظف: د. سارة أحمد (موظف)',
          updatedBy: 'النظام'
        }
      ]
    }
  ]
};