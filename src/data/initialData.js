export const initialData = {
  users: [
    { 
      id: '123456789', 
      name: 'أحمد محمد', 
      phone: '0501234567', 
      password: '123456', 
      role: 'patient', 
      verified: true 
    }
  ],
  staff: [
    { 
      id: 'staff1', 
      name: 'د. سارة أحمد', 
      username: 'sara.ahmed', 
      password: 'staff123', 
      department: 'أشعة', 
      role: 'staff' 
    },
    { 
      id: 'staff2', 
      name: 'أ. محمد علي', 
      username: 'mohamed.ali', 
      password: 'staff123', 
      department: 'طوارئ', 
      role: 'staff' 
    }
  ],
  admins: [
    { 
      id: 'admin1', 
      username: 'admin', 
      password: 'admin123', 
      name: 'مدير النظام', 
      role: 'admin' 
    }
  ],
  departments: ['أشعة', 'طوارئ', 'مواعيد', 'المختبر', 'الصيدلية', 'الاستقبال'],
  complaints: []
};