import React, { useState } from 'react';
import { FileText } from 'lucide-react';

const LoginScreen = ({ data, setCurrentUser, setCurrentView }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    let user = null;
    let userType = '';

    // Try patient login first
    user = data.users.find(u => u.id === formData.username && u.password === formData.password && u.verified);
    if (user) {
      userType = 'patient';
    }

    // Try staff login
    if (!user) {
      user = data.staff.find(s => s.username === formData.username && s.password === formData.password);
      if (user) {
        userType = 'staff';
      }
    }

    // Try admin login
    if (!user) {
      user = data.admins.find(a => a.username === formData.username && a.password === formData.password);
      if (user) {
        userType = 'admin';
      }
    }

    if (user) {
      setCurrentUser(user);
      const targetView = userType === 'patient' ? 'patient-dashboard' : 
                        userType === 'staff' ? 'staff-dashboard' : 'admin-dashboard';
      setCurrentView(targetView);
      setError('');
    } else {
      setError('بيانات الدخول غير صحيحة');
    }
    
    return false;
  };

  const loginScreenStyles = {
    container: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4",
    card: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-md fade-in",
    header: "text-center mb-8",
    logo: "mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4",
    title: "text-2xl font-bold text-gray-900",
    subtitle: "text-gray-600 mt-2",
    form: "space-y-4",
    inputGroup: "space-y-2",
    label: "block text-sm font-medium text-gray-700",
    input: "input-field",
    button: "btn-primary w-full",
    error: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm",
    link: "text-blue-600 hover:text-blue-800 text-sm",
    demo: "mt-6 p-4 bg-gray-50 rounded-lg text-xs"
  };

  return (
    <div className={loginScreenStyles.container}>
      <div className={loginScreenStyles.card}>
        <div className={loginScreenStyles.header}>
          <div className={loginScreenStyles.logo}>
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className={loginScreenStyles.title}>نظام إدارة الشكاوى</h1>
          <p className={loginScreenStyles.subtitle}>مستشفى المملكة</p>
          <p className="text-sm text-gray-500 mt-1">دخول موحد لجميع المستخدمين</p>
        </div>

        <form onSubmit={handleLogin} className={loginScreenStyles.form}>
          <div className={loginScreenStyles.inputGroup}>
            <label className={loginScreenStyles.label}>
              اسم المستخدم / رقم الهوية
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className={loginScreenStyles.input}
              placeholder="أدخل اسم المستخدم أو رقم الهوية"
              required
            />
          </div>

          <div className={loginScreenStyles.inputGroup}>
            <label className={loginScreenStyles.label}>كلمة المرور</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className={loginScreenStyles.input}
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          {error && (
            <div className={loginScreenStyles.error}>
              {error}
            </div>
          )}

          <button type="submit" className={loginScreenStyles.button}>
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setCurrentView('register')}
            className={loginScreenStyles.link}
          >
            إنشاء حساب جديد (للمرضى)
          </button>
        </div>

        {/* Demo Credentials */}
        <div className={loginScreenStyles.demo}>
          <p className="font-semibold mb-2 text-center">بيانات تجريبية للاختبار:</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">مريض:</span>
              <span>123456789 / 123456</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">موظف:</span>
              <span>sara.ahmed / staff123</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">إدارة:</span>
              <span>admin / admin123</span>
            </div>
          </div>
          <p className="text-center mt-2 text-gray-500">سيتم تحديد نوع المستخدم تلقائياً</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;