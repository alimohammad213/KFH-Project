import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Import services
import { authService } from './services/api';

// Import components
import LoginScreen from './components/Auth/LoginScreen';
import RegisterScreen from './components/Auth/RegisterScreen';
import PatientDashboard from './components/Patient/PatientDashboard';
import StaffDashboard from './components/Staff/StaffDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';

// إنشاء Context للبيانات العامة
const AppContext = createContext();

// Hook لاستخدام البيانات العامة
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext يجب استخدامه داخل AppProvider');
  }
  return context;
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState('');

  // التحقق من وجود جلسة مفعلة عند تحميل التطبيق
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      console.log('التحقق من الجلسة المحفوظة...');
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('لا يوجد توكن محفوظ');
        setLoading(false);
        return;
      }

      // التحقق من صحة التوكن
      const result = await authService.verifyToken();
      
      if (result.success) {
        const { user } = result.data;
        console.log('تم استعادة الجلسة:', {
          id: user.id,
          name: user.name,
          role: user.role
        });
        
        setCurrentUser(user);
        
        // تحديد الواجهة المناسبة
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
            targetView = 'login';
        }
        
        setCurrentView(targetView);
      } else {
        console.log('التوكن غير صحيح، العودة لتسجيل الدخول');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('خطأ في التحقق من الجلسة:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('تسجيل خروج المستخدم...');
      
      // استدعاء API تسجيل الخروج
      await authService.logout();
      
      // مسح البيانات المحلية
      setCurrentUser(null);
      setCurrentView('login');
      setAppError('');
      
      console.log('تم تسجيل الخروج بنجاح');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      // حتى لو فشل الطلب، نمسح البيانات المحلية
      setCurrentUser(null);
      setCurrentView('login');
      setAppError('');
    }
  };

  // معالجة أخطاء التطبيق العامة
  const handleAppError = (error) => {
    console.error('خطأ في التطبيق:', error);
    setAppError(error);
    
    // إخفاء رسالة الخطأ بعد 5 ثوان
    setTimeout(() => {
      setAppError('');
    }, 5000);
  };

  // معالجة أخطاء المصادقة (انتهاء صلاحية التوكن)
  const handleAuthError = () => {
    console.log('خطأ في المصادقة، إعادة التوجه لتسجيل الدخول');
    setCurrentUser(null);
    setCurrentView('login');
    setAppError('انتهت صلاحية جلستك، يرجى تسجيل الدخول مرة أخرى');
  };

  // التحقق من الاتصال بالإنترنت
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('تم الاتصال بالإنترنت');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('انقطع الاتصال بالإنترنت');
      setAppError('لا يوجد اتصال بالإنترنت');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // البيانات المشتركة لجميع المكونات
  const appContextValue = {
    // المستخدم الحالي
    currentUser,
    setCurrentUser,
    
    // العرض الحالي
    currentView,
    setCurrentView,
    
    // الوظائف المساعدة
    logout,
    handleAppError,
    handleAuthError,
    
    // حالة التطبيق
    isOnline,
    loading,
    appError
  };

  // تحديد المكون المناسب حسب العرض
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <LoginScreen />;
      
      case 'register':
        return <RegisterScreen />;
      
      case 'patient-dashboard':
        if (!currentUser || currentUser.role !== 'patient') {
          setCurrentView('login');
          return <LoginScreen />;
        }
        return <PatientDashboard />;
      
      case 'staff-dashboard':
        if (!currentUser || !['staff', 'supervisor', 'manager'].includes(currentUser.role)) {
          setCurrentView('login');
          return <LoginScreen />;
        }
        return <StaffDashboard />;
      
      case 'admin-dashboard':
        if (!currentUser || currentUser.role !== 'admin') {
          setCurrentView('login');
          return <LoginScreen />;
        }
        return <AdminDashboard />;
      
      default:
        return <LoginScreen />;
    }
  };

  // شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل التطبيق...</p>
          <p className="text-sm text-gray-500 mt-2">التحقق من الجلسة المحفوظة</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="App">
        {/* شريط رسائل الأخطاء العامة */}
        {appError && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-3 px-4 shadow-lg">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <span>{appError}</span>
              <button 
                onClick={() => setAppError('')}
                className="text-white hover:text-gray-200 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* شريط حالة الاتصال */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-40 bg-orange-500 text-white text-center py-2 px-4">
            <span className="text-sm">⚠️ لا يوجد اتصال بالإنترنت</span>
          </div>
        )}

        {/* المحتوى الرئيسي */}
        <div className={appError || !isOnline ? 'pt-12' : ''}>
          {renderCurrentView()}
        </div>

        {/* معلومات المطور (في بيئة التطوير فقط) */}
        {process.env.NODE_ENV === 'development' && currentUser && (
          <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
            <div>المستخدم: {currentUser.name}</div>
            <div>الدور: {currentUser.role}</div>
            <div>المعرف: {currentUser.id}</div>
            <div>العرض: {currentView}</div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

export default App;