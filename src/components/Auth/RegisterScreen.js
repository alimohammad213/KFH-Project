import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../../App'; // استيراد الـ Context

const RegisterScreen = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', nationalId: '', phone: '', password: '', confirmPassword: '', otp: ''
  });
  const [errors, setErrors] = useState({});
  const [generatedOTP, setGeneratedOTP] = useState('');

  // استخدام البيانات من الـ Context
  const { data, addUser, setCurrentView } = useAppContext();

  const registerStyles = {
    container: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4",
    card: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-md fade-in",
    header: "text-center mb-8",
    logo: "mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4",
    title: "text-2xl font-bold text-gray-900",
    progressBar: "flex justify-center mt-4",
    progressStep: "w-8 h-8 rounded-full flex items-center justify-center",
    progressLine: "w-12 h-1 mt-4",
    form: "space-y-4",
    inputGroup: "space-y-2",
    label: "block text-sm font-medium text-gray-700",
    input: "input-field",
    inputError: "input-field border-red-500",
    error: "text-red-500 text-xs mt-1",
    button: "btn-primary",
    buttonSecondary: "btn-secondary",
    link: "text-blue-600 hover:text-blue-800 text-sm"
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
    
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'رقم الهوية مطلوب';
    } else if (formData.nationalId.length !== 10) {
      newErrors.nationalId = 'رقم الهوية يجب أن يكون 10 أرقام';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الجوال مطلوب';
    } else if (!/^05[0-9]{8}$/.test(formData.phone)) {
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
    
    if (data.users.find(u => u.id === formData.nationalId)) {
      newErrors.nationalId = 'رقم الهوية مسجل مسبقاً';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOTP = () => {
    if (validateStep1()) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOTP(otp);
      setStep(2);
      alert(`تم إرسال رمز التحقق: ${otp}`);
    }
  };

  const verifyOTP = () => {
    if (formData.otp === generatedOTP) {
      const newUser = {
        id: formData.nationalId,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        role: 'patient',
        verified: true,
        createdAt: new Date().toISOString()
      };

      addUser(newUser);

      alert('تم إنشاء الحساب بنجاح!');
      setCurrentView('login');
    } else {
      setErrors({ otp: 'رمز التحقق غير صحيح' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', nationalId: '', phone: '', password: '', confirmPassword: '', otp: ''
    });
    setErrors({});
    setGeneratedOTP('');
    setStep(1);
  };

  return (
    <div className={registerStyles.container}>
      <div className={registerStyles.card}>
        <div className={registerStyles.header}>
          <div className={registerStyles.logo}>
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h1 className={registerStyles.title}>إنشاء حساب جديد</h1>
          <div className={registerStyles.progressBar}>
            <div className={`${registerStyles.progressStep} ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
            <div className={`${registerStyles.progressLine} ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`${registerStyles.progressStep} ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
          </div>
        </div>

        {step === 1 ? (
          <div className={registerStyles.form}>
            <div className={registerStyles.inputGroup}>
              <label className={registerStyles.label}>الاسم الكامل *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={errors.name ? registerStyles.inputError : registerStyles.input}
                placeholder="أدخل اسمك الكامل"
                maxLength="100"
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
              />
              {errors.confirmPassword && <p className={registerStyles.error}>{errors.confirmPassword}</p>}
            </div>

            <button onClick={sendOTP} className={`${registerStyles.button} w-full`}>
              إرسال رمز التحقق
            </button>
          </div>
        ) : (
          <div className={registerStyles.form}>
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-2">تم إرسال رمز التحقق إلى رقم الجوال</p>
              <p className="font-bold text-lg text-blue-600">{formData.phone}</p>
              <p className="text-sm text-gray-500 mt-2">
                الرمز صالح لمدة 5 دقائق
              </p>
            </div>

            <div className={registerStyles.inputGroup}>
              <label className={registerStyles.label}>رمز التحقق *</label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})}
                className={`${errors.otp ? registerStyles.inputError : registerStyles.input} text-center text-2xl tracking-widest`}
                maxLength="6"
                placeholder="000000"
              />
              {errors.otp && <p className={registerStyles.error}>{errors.otp}</p>}
            </div>

            <div className="space-y-3">
              <button onClick={verifyOTP} className={`btn-success w-full`}>
                تأكيد وإنشاء الحساب
              </button>

              <button onClick={() => setStep(1)} className={`${registerStyles.buttonSecondary} w-full`}>
                العودة للخطوة السابقة
              </button>
              
              <button 
                onClick={() => {
                  const otp = Math.floor(100000 + Math.random() * 900000).toString();
                  setGeneratedOTP(otp);
                  alert(`رمز التحقق الجديد: ${otp}`);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm w-full text-center"
              >
                إعادة إرسال الرمز
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setCurrentView('login')}
            className={registerStyles.link}
          >
            العودة لتسجيل الدخول
          </button>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          بإنشاء حساب، فإنك توافق على شروط الخدمة وسياسة الخصوصية
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;