export const initialData = {
  users: [
    { id: '123456789', name: 'أحمد محمد', phone: '0501234567', password: '123456', role: 'patient', verified: true }
  ],
  
  staff: [
    // موظفين عاديين
    { id: 'staff1', name: 'د. سارة أحمد', username: 'sara.ahmed', password: 'staff123', department: 'أشعة', role: 'staff', level: 1 },
    { id: 'staff2', name: 'أ. محمد علي', username: 'mohamed.ali', password: 'staff123', department: 'طوارئ', role: 'staff', level: 1 },
    
    // مشرفين
    { id: 'super1', name: 'د. خالد الشمري', username: 'khalid.supervisor', password: 'super123', department: 'أشعة', role: 'supervisor', level: 2 },
    { id: 'super2', name: 'د. فاطمة العتيبي', username: 'fatima.supervisor', password: 'super123', department: 'طوارئ', role: 'supervisor', level: 2 },
    
    // مديرين
    { id: 'dm1', name: 'د. نورا المالكي', username: 'nora.manager', password: 'mgr123', department: 'أشعة', role: 'manager', level: 3 },
    { id: 'dm2', name: 'د. سعد الغامدي', username: 'saad.manager', password: 'mgr123', department: 'طوارئ', role: 'manager', level: 3 }
  ],
  
  admins: [
    { id: 'admin1', username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'admin', level: 4 }
  ],
  
  departments: ['أشعة', 'طوارئ', 'مواعيد', 'المختبر', 'الصيدلية', 'الاستقبال'],
  complaints: []
};