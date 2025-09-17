import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { complaintsService, departmentsService } from '../../services/api';
import { useAppContext } from '../../App';

const NewComplaintForm = ({ setActiveTab, onComplaintCreated }) => {
  const [formData, setFormData] = useState({
    department_id: '',
    subject: '',
    customSubject: '',
    description: '',
    priority: 'متوسط',
    attachments: []
  });
  const [departments, setDepartments] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const { currentUser, handleAppError } = useAppContext();

  const formStyles = {
    container: "max-w-2xl mx-auto",
    card: "card fade-in",
    title: "text-xl font-bold mb-6",
    form: "space-y-4",
    inputGroup: "space-y-2",
    label: "block text-sm font-medium text-gray-700",
    input: "input-field",
    select: "input-field",
    textarea: "input-field",
    uploadArea: "border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors",
    uploadIcon: "mx-auto w-8 h-8 text-gray-400 mb-2",
    uploadText: "text-sm text-gray-500",
    buttonGroup: "flex gap-4",
    button: "btn-primary",
    buttonSecondary: "btn-secondary",
    buttonSuccess: "btn-success",
    buttonDisabled: "btn-primary opacity-50 cursor-not-allowed",
    previewCard: "bg-gray-50 p-4 rounded-lg space-y-3",
    previewItem: "space-y-1",
    previewLabel: "font-medium",
    previewValue: "text-gray-700",
    disclaimer: "bg-yellow-50 border border-yellow-200 p-4 rounded-lg",
    disclaimerIcon: "w-5 h-5 text-yellow-600 mt-0.5 ml-2",
    disclaimerContent: "flex-1",
    disclaimerTitle: "font-semibold text-yellow-800",
    disclaimerText: "text-yellow-700 text-sm mt-1",
    errorAlert: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4",
    successAlert: "bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4"
  };

  // قائمة مواضيع الشكاوى المصنفة حسب الأقسام
  const complaintSubjects = {
    "عام": [
      "تأخير في المواعيد",
      "سوء تعامل من الموظفين",
      "نظافة المرافق",
      "أوقات الانتظار الطويلة",
      "عدم وضوح المعلومات",
      "مشاكل في الفوترة",
      "صعوبة في الوصول للخدمات",
      "عدم توفر الخدمة المطلوبة"
    ],
    "أشعة": [
      "تأخير في موعد الأشعة",
      "جودة صور الأشعة غير واضحة",
      "عدم شرح الإجراءات بوضوح",
      "مشاكل في التحضير للأشعة",
      "عدم توفر النتائج في الوقت المحدد",
      "سوء تعامل فني الأشعة",
      "عدم الراحة أثناء الفحص",
      "مشاكل في الحجز"
    ],
    "طوارئ": [
      "طول فترة الانتظار",
      "عدم إعطاء الأولوية المناسبة",
      "سوء تعامل طاقم الطوارئ",
      "عدم وضوح التشخيص",
      "نقص في المعدات الطبية",
      "عدم توفر الأسرة",
      "مشاكل في الإسعافات الأولية",
      "عدم المتابعة المناسبة"
    ],
    "مواعيد": [
      "صعوبة في الحجز",
      "إلغاء المواعيد بدون إشعار",
      "تأخير الطبيب عن الموعد",
      "عدم توفر المواعيد المناسبة",
      "مشاكل في نظام الحجز الإلكتروني",
      "عدم الالتزام بالمواعيد المحددة",
      "صعوبة في تغيير الموعد",
      "عدم وضوح تعليمات الموعد"
    ],
    "المختبر": [
      "تأخير في نتائج التحاليل",
      "عدم دقة النتائج",
      "سوء تعامل فني المختبر",
      "مشاكل في أخذ العينات",
      "عدم شرح التحضير للتحليل",
      "فقدان العينات",
      "مشاكل في التحاليل المستعجلة",
      "عدم توفر بعض التحاليل"
    ],
    "الصيدلية": [
      "عدم توفر الدواء",
      "تأخير في صرف الدواء",
      "خطأ في الدواء المصروف",
      "عدم وضوح تعليمات الاستخدام",
      "انتهاء صلاحية الدواء",
      "سوء تعامل الصيدلي",
      "مشاكل في التأمين الطبي",
      "عدم توفر البدائل"
    ],
    "الاستقبال": [
      "سوء تعامل موظف الاستقبال",
      "طول فترة الانتظار للتسجيل",
      "مشاكل في البيانات الشخصية",
      "عدم وضوح المعلومات المقدمة",
      "مشاكل في نظام التأمين",
      "صعوبة في الإجراءات",
      "عدم توجيه المريض للمكان الصحيح",
      "مشاكل في الفوترة"
    ]
  };

  // دالة للحصول على مواضيع القسم
  const getSubjectsForDepartment = (departmentName) => {
    return complaintSubjects[departmentName] || complaintSubjects["عام"];
  };

  // جلب الأقسام عند تحميل المكون
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      
      // جلب الأقسام من الـ API
      const result = await departmentsService.getDepartments();
      
      if (result.success) {
        setDepartments(result.data.departments || []);
        console.log('تم جلب الأقسام بنجاح:', result.data.departments);
      } else {
        console.error('خطأ في جلب الأقسام:', result.error);
        // في حالة فشل جلب الأقسام، استخدم القائمة الافتراضية
        const defaultDepartments = [
          { id: 1, name: 'أشعة' },
          { id: 2, name: 'طوارئ' },
          { id: 3, name: 'مواعيد' },
          { id: 4, name: 'المختبر' },
          { id: 5, name: 'الصيدلية' },
          { id: 6, name: 'الاستقبال' }
        ];
        setDepartments(defaultDepartments);
        handleAppError('حدث خطأ في جلب الأقسام، سيتم استخدام القائمة الافتراضية');
      }
    } catch (error) {
      console.error('خطأ في جلب الأقسام:', error);
      
      // في حالة الخطأ، استخدم القائمة الافتراضية
      const defaultDepartments = [
        { id: 1, name: 'أشعة' },
        { id: 2, name: 'طوارئ' },
        { id: 3, name: 'مواعيد' },
        { id: 4, name: 'المختبر' },
        { id: 5, name: 'الصيدلية' },
        { id: 6, name: 'الاستقبال' }
      ];
      setDepartments(defaultDepartments);
      handleAppError('حدث خطأ في الاتصال، سيتم استخدام الأقسام الافتراضية');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const complaintData = {
        department_id: parseInt(formData.department_id),
        subject: formData.subject === "أخرى" ? formData.customSubject.trim() : formData.subject,
        description: formData.description.trim(),
        priority: formData.priority
      };

      console.log('إرسال شكوى جديدة:', complaintData);

      const result = await complaintsService.createComplaint(complaintData);

      if (result.success) {
        // إظهار رسالة نجاح
        setError('');
        alert(`تم إرسال الشكوى بنجاح!\nرقم الشكوى: ${result.data.complaint.id}`);
        
        // تحديث قائمة الشكاوى
        if (onComplaintCreated) {
          onComplaintCreated();
        }
        
        // العودة لصفحة الشكاوى
        setActiveTab('complaints');
        
        // إعادة تعيين النموذج
        resetForm();
      } else {
        setError(result.error);
        handleAppError(result.error);
      }
    } catch (error) {
      console.error('خطأ في إرسال الشكوى:', error);
      setError('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
      handleAppError('حدث خطأ في إرسال الشكوى');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      department_id: '',
      subject: '',
      customSubject: '',
      description: '',
      priority: 'متوسط',
      attachments: []
    });
    setStep(1);
    setError('');
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    // في المستقبل، سنرسل الملفات للسيرفر
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))]
    });
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index)
    });
  };

  const getDepartmentName = (id) => {
    const dept = departments.find(d => d.id === parseInt(id));
    return dept ? dept.name : '';
  };

  const isFormValid = () => {
    const hasValidSubject = formData.subject && 
      (formData.subject !== "أخرى" || (formData.customSubject && formData.customSubject.trim()));
    
    return formData.department_id && 
           hasValidSubject && 
           formData.description.trim();
  };

  return (
    <div className={formStyles.container}>
      <div className={formStyles.card}>
        <h2 className={formStyles.title}>شكوى جديدة</h2>
        
        {error && (
          <div className={formStyles.errorAlert}>
            {error}
          </div>
        )}
        
        {step === 1 ? (
          <div className={formStyles.form}>
            <div className={formStyles.inputGroup}>
              <label className={formStyles.label}>القسم *</label>
              {loadingDepartments ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="mr-2">جاري تحميل الأقسام...</span>
                </div>
              ) : (
                <select
                  value={formData.department_id}
                  onChange={(e) => {
                    setFormData({
                      ...formData, 
                      department_id: e.target.value,
                      subject: '', // إعادة تعيين الموضوع عند تغيير القسم
                      customSubject: ''
                    });
                  }}
                  className={formStyles.select}
                  required
                >
                  <option value="">اختر القسم</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={formStyles.inputGroup}>
              <label className={formStyles.label}>موضوع الشكوى *</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({
                  ...formData, 
                  subject: e.target.value,
                  customSubject: e.target.value === "أخرى" ? formData.customSubject : ''
                })}
                className={formStyles.select}
                required
                disabled={!formData.department_id}
              >
                <option value="">
                  {formData.department_id ? "اختر موضوع الشكوى" : ""}
                </option>
                {formData.department_id && (() => {
                  // الحصول على اسم القسم المختار
                  const selectedDept = departments.find(d => d.id === parseInt(formData.department_id));
                  const deptName = selectedDept ? selectedDept.name : null;
                  
                  // الحصول على المواضيع المناسبة
                  const subjects = deptName ? getSubjectsForDepartment(deptName) : complaintSubjects["عام"];
                  
                  return subjects.map((subject, index) => (
                    <option key={index} value={subject}>
                      {subject}
                    </option>
                  ));
                })()}
                
                {formData.department_id && (
                  <option value="أخرى">أخرى </option>
                )}
              </select>
              
              {/* إضافة حقل نص إذا اختار "أخرى" */}
              {formData.subject === "أخرى" && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={formData.customSubject || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      customSubject: e.target.value
                    })}
                    className={formStyles.input}
                    placeholder="اكتب موضوع الشكوى"
                    required
                    maxLength="255"
                  />
                  <small className="text-gray-500">
                    {(formData.customSubject || '').length}/255 حرف
                  </small>
                </div>
              )}
            </div>

            <div className={formStyles.inputGroup}>
              <label className={formStyles.label}>الأولوية</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className={formStyles.select}
              >
                <option value="منخفض">منخفض</option>
                <option value="متوسط">متوسط</option>
                <option value="عالي">عالي</option>
              </select>
            </div>

            <div className={formStyles.inputGroup}>
              <label className={formStyles.label}>وصف المشكلة *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={formStyles.textarea}
                rows="5"
                placeholder="اشرح المشكلة بالتفصيل..."
                required
                maxLength="2000"
              />
              <small className="text-gray-500">
                {formData.description.length}/2000 حرف
              </small>
            </div>

            <div className={formStyles.inputGroup}>
              <label className={formStyles.label}>المرفقات (اختياري)</label>
              <div className={formStyles.uploadArea}>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className={formStyles.uploadIcon} />
                  <p className={formStyles.uploadText}>
                    انقر لاختيار الملفات أو اسحبها هنا
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    الصور، PDF، Word (حد أقصى 5 ملفات، 5MB لكل ملف)
                  </p>
                </label>
              </div>
              
              {/* عرض المرفقات المختارة */}
              {formData.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span className="text-sm">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={formStyles.buttonGroup}>
              <button
                onClick={() => setStep(2)}
                disabled={!isFormValid()}
                className={isFormValid() ? formStyles.button : formStyles.buttonDisabled}
              >
                التالي - مراجعة الشكوى
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={formStyles.buttonSecondary}
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className={formStyles.form}>
            <h3 className="text-lg font-semibold text-center mb-4">مراجعة الشكوى قبل الإرسال</h3>
            
            <div className={formStyles.previewCard}>
              <div className={formStyles.previewItem}>
                <span className={formStyles.previewLabel}>القسم:</span>
                <span className={formStyles.previewValue}> {getDepartmentName(formData.department_id)}</span>
              </div>
              <div className={formStyles.previewItem}>
                <span className={formStyles.previewLabel}>الموضوع:</span>
                <span className={formStyles.previewValue}>
                  {formData.subject === "أخرى" ? formData.customSubject : formData.subject}
                </span>
              </div>
              <div className={formStyles.previewItem}>
                <span className={formStyles.previewLabel}>الأولوية:</span>
                <span className={formStyles.previewValue}> {formData.priority}</span>
              </div>
              <div className={formStyles.previewItem}>
                <span className={formStyles.previewLabel}>الوصف:</span>
                <span className={formStyles.previewValue}> {formData.description}</span>
              </div>
              <div className={formStyles.previewItem}>
                <span className={formStyles.previewLabel}>اسم المريض:</span>
                <span className={formStyles.previewValue}> {currentUser.name}</span>
              </div>
              <div className={formStyles.previewItem}>
                <span className={formStyles.previewLabel}>رقم الجوال:</span>
                <span className={formStyles.previewValue}> {currentUser.phone}</span>
              </div>
              <div className={formStyles.previewItem}>
                <span className={formStyles.previewLabel}>التاريخ:</span>
                <span className={formStyles.previewValue}> {new Date().toLocaleDateString('ar-SA')}</span>
              </div>
              {formData.attachments.length > 0 && (
                <div className={formStyles.previewItem}>
                  <span className={formStyles.previewLabel}>المرفقات:</span>
                  <span className={formStyles.previewValue}> {formData.attachments.length} ملف</span>
                </div>
              )}
            </div>

            <div className={formStyles.disclaimer}>
              <div className="flex items-start">
                <AlertCircle className={formStyles.disclaimerIcon} />
                <div className={formStyles.disclaimerContent}>
                  <h4 className={formStyles.disclaimerTitle}>إقرار وموافقة</h4>
                  <p className={formStyles.disclaimerText}>
                    أقر بأن المعلومات المقدمة صحيحة وأوافق على معالجة هذه الشكوى وفقاً لسياسات المستشفى.
                    سيتم تعيين الشكوى للموظف المناسب وستحصل على رقم متابعة.
                  </p>
                </div>
              </div>
            </div>

            <div className={formStyles.buttonGroup}>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className={loading ? formStyles.buttonDisabled : formStyles.buttonSuccess}
              >
                {loading ? 'جاري الإرسال...' : 'إرسال الشكوى نهائياً'}
              </button>
              <button 
                onClick={() => setStep(1)} 
                disabled={loading}
                className={formStyles.buttonSecondary}
              >
                تعديل
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewComplaintForm;