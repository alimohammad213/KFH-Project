import React, { useState } from 'react';
import { AlertCircle, Clock, Settings } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

const EscalationSettings = ({ data, setData, pendingEscalation }) => {
  const [escalationHours, setEscalationHours] = useState(72);

  const escalationStyles = {
    container: "fade-in",
    title: "text-xl font-bold mb-6",
    settingsCard: "card mb-6",
    settingsTitle: "text-lg font-semibold mb-4",
    settingsForm: "space-y-4",
    inputGroup: "space-y-2",
    label: "block text-sm font-medium text-gray-700",
    input: "input-field w-32",
    saveBtn: "btn-primary",
    pendingCard: "card",
    pendingTitle: "text-lg font-semibold mb-4",
    emptyState: "text-gray-500 text-center py-4",
    pendingList: "space-y-4",
    pendingItem: "border border-red-200 rounded-lg p-4 bg-red-50",
    pendingHeader: "flex justify-between items-start",
    pendingInfo: "space-y-2",
    pendingTitle: "font-semibold",
    pendingMeta: "text-sm text-gray-600",
    pendingAlert: "text-sm text-red-600 font-medium",
    escalateBtn: "bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700",
    statsGrid: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",
    statCard: "bg-white p-4 rounded-lg shadow border-l-4",
    statNumber: "text-2xl font-bold",
    statLabel: "text-gray-600 text-sm"
  };

  const handleEscalation = (complaintId) => {
    setData(prev => ({
      ...prev,
      complaints: prev.complaints.map(complaint => {
        if (complaint.id === complaintId) {
          return {
            ...complaint,
            escalated: true,
            status: 'متصعدة',
            updatedAt: new Date().toISOString(),
            timeline: [...complaint.timeline, {
              status: 'متصعدة',
              timestamp: new Date().toISOString(),
              note: 'تم تصعيد الشكوى تلقائياً بسبب تجاوز المهلة الزمنية',
              updatedBy: 'النظام'
            }]
          };
        }
        return complaint;
      })
    }));
    alert('تم تصعيد الشكوى بنجاح');
  };

  const escalateAll = () => {
    if (window.confirm(`هل تريد تصعيد جميع الشكاوى المتأخرة (${pendingEscalation.length} شكوى)؟`)) {
      pendingEscalation.forEach(complaint => {
        handleEscalation(complaint.id);
      });
    }
  };

  const saveSettings = () => {
    // In a real app, this would save to backend
    alert(`تم حفظ الإعدادات - المهلة الزمنية: ${escalationHours} ساعة`);
  };

  const escalatedComplaints = data.complaints.filter(c => c.escalated);
  const avgResolutionTime = data.complaints.filter(c => c.status === 'تم الحل').length > 0 
    ? Math.round(
        data.complaints
          .filter(c => c.status === 'تم الحل')
          .reduce((acc, c) => {
            const hours = (new Date(c.updatedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
            return acc + hours;
          }, 0) / data.complaints.filter(c => c.status === 'تم الحل').length
      )
    : 0;

  return (
    <div className={escalationStyles.container}>
      <h2 className={escalationStyles.title}>إعدادات التصعيد</h2>
      
      {/* Statistics */}
      <div className={escalationStyles.statsGrid}>
        <div className={`${escalationStyles.statCard} border-red-500`}>
          <div className={escalationStyles.statNumber}>{pendingEscalation.length}</div>
          <div className={escalationStyles.statLabel}>شكاوى تحتاج تصعيد</div>
        </div>
        <div className={`${escalationStyles.statCard} border-purple-500`}>
          <div className={escalationStyles.statNumber}>{escalatedComplaints.length}</div>
          <div className={escalationStyles.statLabel}>شكاوى تم تصعيدها</div>
        </div>
        <div className={`${escalationStyles.statCard} border-blue-500`}>
          <div className={escalationStyles.statNumber}>{avgResolutionTime}h</div>
          <div className={escalationStyles.statLabel}>متوسط وقت الحل</div>
        </div>
      </div>

      {/* Settings */}
      <div className={escalationStyles.settingsCard}>
        <h3 className={escalationStyles.settingsTitle}>
          <Settings className="w-5 h-5 inline ml-2" />
          قواعد التصعيد
        </h3>
        <div className={escalationStyles.settingsForm}>
          <div className={escalationStyles.inputGroup}>
            <label className={escalationStyles.label}>
              المهلة الزمنية للتصعيد (بالساعات)
            </label>
            <input
              type="number"
              value={escalationHours}
              onChange={(e) => setEscalationHours(Number(e.target.value))}
              className={escalationStyles.input}
              min="1"
              max="168"
            />
            <p className="text-sm text-gray-500">
              سيتم تصعيد الشكاوى تلقائياً بعد {escalationHours} ساعة من إنشائها
            </p>
          </div>
          
          <div className="flex gap-4">
            <button onClick={saveSettings} className={escalationStyles.saveBtn}>
              حفظ الإعدادات
            </button>
            
            {pendingEscalation.length > 0 && (
              <button 
                onClick={escalateAll}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
              >
                تصعيد جميع الشكاوى المتأخرة ({pendingEscalation.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pending Escalation */}
      <div className={escalationStyles.pendingCard}>
        <h3 className={escalationStyles.pendingTitle}>
          <AlertCircle className="w-5 h-5 inline ml-2 text-red-600" />
          الشكاوى المطلوب تصعيدها ({pendingEscalation.length})
        </h3>
        
        {pendingEscalation.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className={escalationStyles.emptyState}>
                ممتاز! لا توجد شكاوى مطلوب تصعيدها
              </p>
              <p className="text-sm text-gray-400 mt-2">
                جميع الشكاوى يتم التعامل معها في الوقت المحدد
              </p>
            </div>
          </div>
        ) : (
          <div className={escalationStyles.pendingList}>
            {pendingEscalation.map(complaint => {
              const hoursSinceCreated = Math.floor(
                (new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60)
              );
              const assignedStaff = data.staff.find(s => s.id === complaint.assignedTo);
              
              return (
                <div key={complaint.id} className={escalationStyles.pendingItem}>
                  <div className={escalationStyles.pendingHeader}>
                    <div className={escalationStyles.pendingInfo}>
                      <h4 className={escalationStyles.pendingTitle}>{complaint.subject}</h4>
                      <div className={escalationStyles.pendingMeta}>
                        <p>المريض: {complaint.patientName} | القسم: {complaint.department}</p>
                        <p>المعين له: {assignedStaff?.name || 'غير معين'}</p>
                        <p>تاريخ الإنشاء: {formatDateTime(complaint.createdAt)}</p>
                      </div>
                      <p className={escalationStyles.pendingAlert}>
                        ⚠️ تجاوزت المهلة بـ {hoursSinceCreated - escalationHours} ساعة
                      </p>
                      
                      {/* Progress indicator */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>مرور الوقت</span>
                          <span>{hoursSinceCreated}h / {escalationHours}h</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((hoursSinceCreated / escalationHours) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleEscalation(complaint.id)}
                      className={escalationStyles.escalateBtn}
                    >
                      تصعيد الآن
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Escalation Rules Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-blue-800 mb-2">معلومات حول نظام التصعيد</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• يتم فحص الشكاوى تلقائياً كل ساعة للتحقق من الحاجة للتصعيد</li>
          <li>• الشكاوى المحلولة أو المرفوضة لا تحتاج لتصعيد</li>
          <li>• التصعيد يغير حالة الشكوى إلى "متصعدة" ويرسل إشعار للإدارة العليا</li>
          <li>• يمكن تخصيص المهلة الزمنية حسب نوع الشكوى أو القسم</li>
        </ul>
      </div>
    </div>
  );
};

export default EscalationSettings;