import React, { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { autoAssignComplaintWithLevel, getRoleName } from '../../utils/helpers';

const NewComplaintForm = ({ currentUser, data, setData, setActiveTab }) => {
  const [formData, setFormData] = useState({
    department: '',
    subject: '',
    description: '',
    attachments: []
  });
  const [step, setStep] = useState(1);

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
    uploadArea: "border-2 border-dashed border-gray-300 rounded-lg p-4 text-center",
    uploadIcon: "mx-auto w-8 h-8 text-gray-400 mb-2",
    uploadText: "text-sm text-gray-500",
    buttonGroup: "flex gap-4",
    button: "btn-primary",
    buttonSecondary: "btn-secondary",
    buttonSuccess: "btn-success",
    previewCard: "bg-gray-50 p-4 rounded-lg space-y-3",
    previewItem: "space-y-1",
    previewLabel: "font-medium",
    previewValue: "text-gray-700",
    disclaimer: "bg-yellow-50 border border-yellow-200 p-4 rounded-lg",
    disclaimerIcon: "w-5 h-5 text-yellow-600 mt-0.5 ml-2",
    disclaimerContent: "flex-1",
    disclaimerTitle: "font-semibold text-yellow-800",
    disclaimerText: "text-yellow-700 text-sm mt-1"
  };

  const handleSubmit = () => {
    const newComplaint = {
      id: Date.now().toString(),
      patientId: currentUser.id,
      patientName: currentUser.name,
      patientPhone: currentUser.phone,
      department: formData.department,
      subject: formData.subject,
      description: formData.description,
      attachments: formData.attachments,
      status: 'جديدة',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{
        status: 'جديدة',
        timestamp: new Date().toISOString(),
        note: 'تم استلام الشكوى'
      }],
      assignedTo: null,
      escalated: false,
      escalationLevel: 1
    };

    const assignedStaff = autoAssignComplaintWithLevel(newComplaint, data.staff, 1);
    
    if (assignedStaff) {
      newComplaint.assignedTo = assignedStaff.id;
      newComplaint.status = 'تحت المراجعة';
      newComplaint.timeline.push({
        status: 'تحت المراجعة',
        timestamp: new Date().toISOString(),
        note: `تم تعيين الشكوى للموظف: ${assignedStaff.name} (${getRoleName(assignedStaff.role)})`
      });
    }

    setData(prev => ({
      ...prev,
      complaints: [...prev.complaints, newComplaint]
    }));

    alert('تم إرسال الشكوى بنجاح!');
    setActiveTab('complaints');
  };

  return (
    <div className={formStyles.container}>
      <div className={formStyles.card}>
        <h2 className={formStyles.title}>شكوى جديدة</h2>
        
        {step === 1 ? (
          <div className={formStyles.form}>
            <div className={formStyles.inputGroup}>
              <label className={formStyles.label}>القسم</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className={formStyles.select}
                required
              >
                <option value="">اختر القسم</option>
                {data.departments.map(dept => {
                  const availableStaff = data.staff.filter(s => s.department === dept);
                  return (
                    <option key={dept} value={dept}>
                      {dept} ({availableStaff.length} موظف متاح)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={formStyles.inputGroup}>
              <label className={formStyles.label}>موضوع الشكوى</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className={formStyles.input}
                placeholder="اكتب موضوع الشكوى"
                required
              />
            </div>

            <div className={formStyles.inputGroup}>
              <label className={formStyles.label}>وصف المشكلة</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={formStyles.textarea}
                rows="5"
                placeholder="اشرح المشكلة بالتفصيل"
                required
              />
            </div>

            <div className={formStyles.inputGroup}>
              <label className={formStyles.label}>المرفقات (اختياري)</label>
              <div className={formStyles.uploadArea}>
                <Upload className={formStyles.uploadIcon} />
                <p className={formStyles.uploadText}>اسحب الملفات هنا أو انقر للاختيار</p>
              </div>
            </div>

            <div className={formStyles.buttonGroup}>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.department || !formData.subject || !formData.description}
                className={`${formStyles.button} disabled:bg-gray-400 disabled:cursor-not-allowed`}
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
                <span className={formStyles.previewValue}> {formData.department}</span>
              </div>
              <div className={formStyles.previewItem}>
                <span className={formStyles.previewLabel}>الموضوع:</span>
                <span className={formStyles.previewValue}> {formData.subject}</span>
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
            </div>

            <div className={formStyles.disclaimer}>
              <div className="flex items-start">
                <AlertCircle className={formStyles.disclaimerIcon} />
                <div className={formStyles.disclaimerContent}>
                  <h4 className={formStyles.disclaimerTitle}>إقرار وموافقة</h4>
                  <p className={formStyles.disclaimerText}>
                    أقر بأن المعلومات المقدمة صحيحة وأوافق على معالجة هذه الشكوى وفقاً لسياسات المستشفى.
                  </p>
                </div>
              </div>
            </div>

            <div className={formStyles.buttonGroup}>
              <button onClick={handleSubmit} className={formStyles.buttonSuccess}>
                إرسال الشكوى نهائياً
              </button>
              <button onClick={() => setStep(1)} className={formStyles.buttonSecondary}>
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