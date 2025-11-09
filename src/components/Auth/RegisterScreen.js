import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../../App';
import { authService } from '../../services/api';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: '', nationalId: '', phone: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { setCurrentView } = useAppContext();

  const registerStyles = {
    container: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4",
    card: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-md fade-in",
    header: "text-center mb-8",
    logo: "mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4",
    title: "text-2xl font-bold text-gray-900",
    form: "space-y-4",
    inputGroup: "space-y-2",
    label: "block text-sm font-medium text-gray-700",
    input: "input-field",
    inputError: "input-field border-red-500",
    error: "text-red-500 text-xs mt-1",
    button: "btn-primary w-full",
    buttonDisabled: "btn-primary w-full opacity-50 cursor-not-allowed",
    buttonSuccess: "btn-success w-full",
    link: "text-blue-600 hover:text-blue-800 text-sm",
    success: "bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4",
    apiError: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4"
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'الاسم يجب أن يكون حرفين على الأقل';
    }
    
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'رقم الهوية مطلوب';
    } else if (formData.nationalId.length !== 10) {
      newErrors.nationalId = 'رقم الهوية يجب أن يكون 10 أرقام';
    } else if (!/^\d+$/.test(formData.nationalId)) {
      newErrors.nationalId = 'رقم الهوية يجب أن يحتوي على أرقام فقط';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الجوال مطلوب';
    } else if (!/^05\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام';
    }
    
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون على الأقل 6 أحرف';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      console.log('محاولة إنشاء حساب جديد...', {
        name: formData.name,
        nationalId: formData.nationalId,
        phone: formData.phone
      });

      const result = await authService.register({
        name: formData.name.trim(),
        nationalId: formData.nationalId,
        phone: formData.phone,
        password: formData.password
      });

      if (result.success) {
        console.log('تم إنشاء الحساب بنجاح:', result.data);
        
        setSuccessMessage('تم إنشاء حساب المريض بنجاح! يمكنك الآن تسجيل الدخول.');
        
        // إعادة تعيين النموذج
        setFormData({
          name: '', nationalId: '', phone: '', password: '', confirmPassword: ''
        });
        
        // الانتقال لصفحة تسجيل الدخول بعد 3 ثوان
        setTimeout(() => {
          setCurrentView('login');
        }, 3000);

      } else {
        console.log('فشل إنشاء الحساب:', result.error);
        
        // معالجة أخطاء محددة
        if (result.error.includes('رقم الهوية مسجل مسبقاً') || 
            result.error.includes('already exists')) {
          setErrors({ nationalId: 'رقم الهوية مسجل مسبقاً' });
        } else if (result.error.includes('Invalid national ID')) {
          setErrors({ nationalId: 'رقم الهوية غير صحيح' });
        } else if (result.error.includes('Invalid phone number')) {
          setErrors({ phone: 'رقم الجوال غير صحيح' });
        } else {
          setErrors({ api: result.error });
        }
      }
    } catch (error) {
      console.error('خطأ في إنشاء الحساب:', error);
      setErrors({ api: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', nationalId: '', phone: '', password: '', confirmPassword: ''
    });
    setErrors({});
    setSuccessMessage('');
  };

  // ملء بيانات تجريبية للاختبار
  const fillTestData = () => {
    setFormData({
      name: 'محمد أحمد العلي',
      nationalId: '1234567891',
      phone: '0501234568',
      password: '123456',
      confirmPassword: '123456'
    });
    setErrors({});
    setSuccessMessage('');
  };

  return (
    <div className={registerStyles.container}>
      <div className={registerStyles.card}>
        <div className={registerStyles.header}>
          <div className={registerStyles.logo}>
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h1 className={registerStyles.title}>إنشاء حساب مريض جديد</h1>
          <p className="text-gray-600 mt-2">مستشفى </p>
        </div>

        {successMessage && (
          <div className={registerStyles.success}>
            {successMessage}
          </div>
        )}

        {errors.api && (
          <div className={registerStyles.apiError}>
            {errors.api}
          </div>
        )}

        <form onSubmit={handleRegister} className={registerStyles.form}>
          <div className={registerStyles.inputGroup}>
            <label className={registerStyles.label}>الاسم الكامل *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={errors.name ? registerStyles.inputError : registerStyles.input}
              placeholder="أدخل اسمك الكامل"
              maxLength="100"
              disabled={loading}
            />
            {errors.name && <p className={registerStyles.error}>{errors.name}</p>}
          </div>

          <div className={registerStyles.inputGroup}>
            <label className={registerStyles.label}>رقم الهوية الوطنية *</label>
            <input
              type="text"
              value={formData.nationalId}
              onChange={(e) => setFormData({...formData, nationalId: e.target.value.replace(/\D/g, '')})}
              className={errors.nationalId ? registerStyles.inputError : registerStyles.input}
              placeholder="1234567890"
              maxLength="10"
              disabled={loading}
            />
            {errors.nationalId && <p className={registerStyles.error}>{errors.nationalId}</p>}
          </div>

          <div className={registerStyles.inputGroup}>
            <label className={registerStyles.label}>رقم الجوال *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
              className={errors.phone ? registerStyles.inputError : registerStyles.input}
              placeholder="0501234567"
              maxLength="10"
              disabled={loading}
            />
            {errors.phone && <p className={registerStyles.error}>{errors.phone}</p>}
          </div>

          <div className={registerStyles.inputGroup}>
            <label className={registerStyles.label}>كلمة المرور *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className={errors.password ? registerStyles.inputError : registerStyles.input}
              placeholder="اختر كلمة مرور قوية"
              minLength="6"
              disabled={loading}
            />
            {errors.password && <p className={registerStyles.error}>{errors.password}</p>}
          </div>

          <div className={registerStyles.inputGroup}>
            <label className={registerStyles.label}>تأكيد كلمة المرور *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className={errors.confirmPassword ? registerStyles.inputError : registerStyles.input}
              placeholder="أعد كتابة كلمة المرور"
              disabled={loading}
            />
            {errors.confirmPassword && <p className={registerStyles.error}>{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || successMessage}
            className={loading || successMessage ? registerStyles.buttonDisabled : registerStyles.button}
          >
            {loading ? 'جاري إنشاء الحساب...' : successMessage ? 'تم الإنشاء بنجاح!' : 'إنشاء حساب المريض'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <button
              onClick={() => setCurrentView('login')}
              className={registerStyles.link}
              disabled={loading}
            >
              العودة لتسجيل الدخول
            </button>
          </div>

          {/* أزرار إضافية */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={fillTestData}
              className="text-blue-600 hover:text-blue-800 text-xs"
              disabled={loading}
            >
              تعبئة بيانات تجريبية
            </button>
            
            {(Object.keys(errors).length > 0 || successMessage) && (
              <button
                onClick={resetForm}
                className="text-gray-600 hover:text-gray-800 text-xs"
                disabled={loading}
              >
                مسح النموذج
              </button>
            )}
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
          <p>بإنشاء حساب، فإنك توافق على شروط الخدمة وسياسة الخصوصية</p>
          <p>سيتم التحقق من هويتك قبل تفعيل الحساب</p>
          <p>هذا النظام مخصص للمرضى فقط</p>
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

export default RegisterScreen;