import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { useAppContext } from '../../App';
import { authService } from '../../services/api';

const LoginScreen = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setCurrentUser, setCurrentView } = useAppContext();

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
    buttonDisabled: "btn-primary w-full opacity-50 cursor-not-allowed",
    error: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm",
    link: "text-blue-600 hover:text-blue-800 text-sm",
    demo: "mt-6 p-4 bg-gray-50 rounded-lg text-xs"
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('محاولة تسجيل الدخول...', { username: formData.username });
      
      const result = await authService.login({
        username: formData.username,
        password: formData.password
      });

      if (result.success) {
        const { user } = result.data;
        
        console.log('نجح تسجيل الدخول:', {
          id: user.id,
          name: user.name,
          role: user.role,
          level: user.level
        });

        // تحديث المستخدم الحالي
        setCurrentUser(user);
        
        // تحديد الواجهة المناسبة حسب دور المستخدم
        let targetView;
        switch (user.role) {
          case 'patient':
            targetView = 'patient-dashboard';
            break;
          case 'staff':
          case 'supervisor':
          case 'manager':
            targetView = 'staff-dashboard';
            break;
          case 'admin':
            targetView = 'admin-dashboard';
            break;
          default:
            console.warn('دور مستخدم غير معروف:', user.role);
            targetView = 'patient-dashboard';
        }
        
        setCurrentView(targetView);
        setError('');
      } else {
        console.log('فشل تسجيل الدخول:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // ملء البيانات التجريبية
  const fillDemoData = (username, password) => {
    setFormData({ username, password });
    setError('');
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          {error && (
            <div className={loginScreenStyles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={loading ? loginScreenStyles.buttonDisabled : loginScreenStyles.button}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setCurrentView('register')}
            className={loginScreenStyles.link}
            disabled={loading}
          >
            إنشاء حساب جديد (للمرضى)
          </button>
        </div>

        <div className={loginScreenStyles.demo}>
          <p className="font-semibold mb-2 text-center">بيانات تجريبية للاختبار:</p>
          <div className="space-y-2">
            <div 
              className="flex items-center justify-between hover:bg-blue-50 p-2 rounded cursor-pointer"
              onClick={() => fillDemoData('123456789', '123456')}
            >
              <span className="font-medium">مريض:</span>
              <span>123456789 / 123456</span>
            </div>
            <div 
              className="flex items-center justify-between hover:bg-blue-50 p-2 rounded cursor-pointer"
              onClick={() => fillDemoData('sara.ahmed', 'staff123')}
            >
              <span className="font-medium">موظف:</span>
              <span>sara.ahmed / staff123</span>
            </div>
            <div 
              className="flex items-center justify-between hover:bg-blue-50 p-2 rounded cursor-pointer"
              onClick={() => fillDemoData('khalid.supervisor', 'super123')}
            >
              <span className="font-medium">مشرف:</span>
              <span>khalid.supervisor / super123</span>
            </div>
            <div 
              className="flex items-center justify-between hover:bg-blue-50 p-2 rounded cursor-pointer"
              onClick={() => fillDemoData('nora.manager', 'mgr123')}
            >
              <span className="font-medium">مدير:</span>
              <span>nora.manager / mgr123</span>
            </div>
            <div 
              className="flex items-center justify-between hover:bg-blue-50 p-2 rounded cursor-pointer"
              onClick={() => fillDemoData('admin', 'admin123')}
            >
              <span className="font-medium">إدارة:</span>
              <span>admin / admin123</span>
            </div>
          </div>
          <p className="text-center mt-2 text-gray-500">اضغط على أي سطر لتعبئة البيانات</p>
        </div>

        {/* مؤشر الاتصال */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {navigator.onLine ? 'متصل بالخادم' : 'غير متصل بالخادم'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;