import React, { useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';

const RegisterScreen = ({ data, setData, setCurrentView }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', nationalId: '', phone: '', password: '', confirmPassword: '', otp: ''
  });
  const [errors, setErrors] = useState({});
  const [generatedOTP, setGeneratedOTP] = useState('');

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
    if (!formData.nationalId.trim()) newErrors.nationalId = 'رقم الهوية مطلوب';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الجوال مطلوب';
    if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    
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

      setData(prev => ({
        ...prev,
        users: [...prev.users, newUser]
      }));

      alert('تم إنشاء الحساب بنجاح!');
      setCurrentView('login');
    } else {
      setErrors({ otp: 'رمز التحقق غير صحيح' });
    }
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
              <label className={registerStyles.label}>الاسم الكامل</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={errors.name ? registerStyles.inputError : registerStyles.input}
              />
              {errors.name && <p className={registerStyles.error}>{errors.name}</p>}
            </div>

            <div className={registerStyles.inputGroup}>
              <label className={registerStyles.label}>رقم الهوية الوطنية</label>
              <input
                type="text"
                value={formData.nationalId}
                onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                className={errors.nationalId ? registerStyles.inputError : registerStyles.input}
              />
              {errors.nationalId && <p className={registerStyles.error}>{errors.nationalId}</p>}
            </div>

            <div className={registerStyles.inputGroup}>
              <label className={registerStyles.label}>رقم الجوال</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={errors.phone ? registerStyles.inputError : registerStyles.input}
              />
              {errors.phone && <p className={registerStyles.error}>{errors.phone}</p>}
            </div>

            <div className={registerStyles.inputGroup}>
              <label className={registerStyles.label}>كلمة المرور</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={errors.password ? registerStyles.inputError : registerStyles.input}
              />
              {errors.password && <p className={registerStyles.error}>{errors.password}</p>}
            </div>

            <div className={registerStyles.inputGroup}>
              <label className={registerStyles.label}>تأكيد كلمة المرور</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className={errors.confirmPassword ? registerStyles.inputError : registerStyles.input}
              />
              {errors.confirmPassword && <p className={registerStyles.error}>{errors.confirmPassword}</p>}
            </div>

            <button onClick={sendOTP} className={`${registerStyles.button} w-full`}>
              إرسال رمز التحقق
            </button>
          </div>
        ) : (
          <div className={registerStyles.form}>
            <div className="text-center">
              <p className="text-gray-600 mb-4">تم إرسال رمز التحقق إلى رقم الجوال</p>
              <p className="font-bold text-lg">{formData.phone}</p>
            </div>

            <div className={registerStyles.inputGroup}>
              <label className={registerStyles.label}>رمز التحقق</label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value})}
                className={`${errors.otp ? registerStyles.inputError : registerStyles.input} text-center text-2xl tracking-widest`}
                maxLength="6"
                placeholder="000000"
              />
              {errors.otp && <p className={registerStyles.error}>{errors.otp}</p>}
            </div>

            <button onClick={verifyOTP} className={`btn-success w-full`}>
              تأكيد وإنشاء الحساب
            </button>

            <button onClick={() => setStep(1)} className={`${registerStyles.buttonSecondary} w-full`}>
              العودة للخطوة السابقة
            </button>
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
      </div>
    </div>
  );
};

export default RegisterScreen;