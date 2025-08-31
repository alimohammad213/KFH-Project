import React, { useState } from 'react';
import { X, Users, LogOut } from 'lucide-react';
import { getStatusColor, formatDateTime } from '../../utils/helpers';
import { useAppContext } from '../../App'; // استيراد الـ Context

const ComplaintDetails = ({ onBack }) => {
  const { currentUser, logout, staffComplaints, updateComplaint } = useAppContext();
  
  // نحتاج تحديد الشكوى المحددة - سأقوم بحل مؤقت
  const complaint = staffComplaints[0]; // سنحتاج تمرير ID الشكوى لاحقاً
  
  const [status, setStatus] = useState(complaint?.status || 'جديدة');
  const [note, setNote] = useState('');

  const detailsStyles = {
    container: "min-h-screen bg-gray-50",
    header: "bg-white shadow-sm border-b",
    headerContent: "max-w-7xl mx-auto px-4",
    headerInner: "flex justify-between items-center h-16",
    headerLeft: "flex items-center",
    logo: "w-8 h-8 text-blue-600 ml-3",
    title: "text-xl font-bold",
    headerRight: "flex items-center space-x-4 space-x-reverse",
    userName: "text-gray-700",
    userDept: "text-sm text-gray-500",
    logoutBtn: "flex items-center text-gray-700 hover:text-red-600 transition-colors",
    content: "max-w-7xl mx-auto px-4 py-8",
    backBtn: "flex items-center text-blue-600 hover:text-blue-800 mb-4",
    card: "card fade-in",
    cardHeader: "flex justify-between items-start mb-6",
    cardTitle: "text-xl font-bold",
    closeBtn: "text-gray-500 hover:text-gray-700",
    infoGrid: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6",
    infoSection: "space-y-3",
    sectionTitle: "font-semibold mb-3",
    infoItem: "space-y-2 text-sm",
    infoLabel: "font-medium",
    subjectSection: "mb-6",
    subjectTitle: "font-semibold mb-3",
    subjectText: "text-lg",
    descSection: "mb-6",
    descTitle: "font-semibold mb-3",
    descContent: "bg-gray-50 p-4 rounded-lg",
    timelineSection: "mb-6",
    timelineTitle: "font-semibold mb-3",
    timelineList: "space-y-3",
    timelineItem: "flex items-start",
    timelineDot: "w-4 h-4 rounded-full mt-1 ml-3",
    timelineContent: "flex-1",
    timelineHeader: "flex justify-between items-start",
    timelineInfo: "space-y-1",
    timelineStatus: "font-medium",
    timelineNote: "text-sm text-gray-600",
    timelineUser: "text-xs text-gray-500",
    timelineTime: "text-xs text-gray-500",
    updateSection: "border-t pt-6",
    updateTitle: "font-semibold mb-3",
    updateForm: "space-y-4",
    inputGroup: "space-y-2",
    label: "block text-sm font-medium text-gray-700",
    select: "input-field",
    textarea: "input-field",
    updateBtn: "btn-primary"
  };

  const handleUpdate = () => {
    if (!complaint) return;
    
    const updatedTimeline = [...complaint.timeline, {
      status: status,
      timestamp: new Date().toISOString(),
      note: note || `تم تحديث الحالة إلى: ${status}`,
      updatedBy: currentUser.name
    }];

    updateComplaint(complaint.id, {
      status: status,
      timeline: updatedTimeline
    });

    setNote('');
    alert('تم تحديث حالة الشكوى بنجاح');
  };

  if (!complaint) {
    return (
      <div className={detailsStyles.container}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">لم يتم العثور على الشكوى</h2>
            <button onClick={onBack} className="btn-primary">
              العودة للقائمة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={detailsStyles.container}>
      {/* Header */}
      <div className={detailsStyles.header}>
        <div className={detailsStyles.headerContent}>
          <div className={detailsStyles.headerInner}>
            <div className={detailsStyles.headerLeft}>
              <Users className={detailsStyles.logo} />
              <h1 className={detailsStyles.title}>نظام الشكاوى - الموظف</h1>
            </div>
            <div className={detailsStyles.headerRight}>
              <div className="text-right">
                <span className={detailsStyles.userName}>مرحباً، {currentUser.name}</span>
                <div className={detailsStyles.userDept}>({currentUser.department})</div>
              </div>
              <button onClick={logout} className={detailsStyles.logoutBtn}>
                <LogOut className="w-5 h-5 ml-1" />
                خروج
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={detailsStyles.content}>
        <button onClick={onBack} className={detailsStyles.backBtn}>
          ← العودة للقائمة
        </button>

        <div className={detailsStyles.card}>
          <div className={detailsStyles.cardHeader}>
            <h2 className={detailsStyles.cardTitle}>تفاصيل الشكوى</h2>
            <button onClick={onBack} className={detailsStyles.closeBtn}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className={detailsStyles.infoGrid}>
            <div>
              <h3 className={detailsStyles.sectionTitle}>بيانات المريض</h3>
              <div className={detailsStyles.infoSection}>
                <div className={detailsStyles.infoItem}>
                  <span className={detailsStyles.infoLabel}>الاسم:</span>
                  <span> {complaint.patientName}</span>
                </div>
                <div className={detailsStyles.infoItem}>
                  <span className={detailsStyles.infoLabel}>رقم الجوال:</span>
                  <span> {complaint.patientPhone}</span>
                </div>
                <div className={detailsStyles.infoItem}>
                  <span className={detailsStyles.infoLabel}>رقم الهوية:</span>
                  <span> {complaint.patientId}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className={detailsStyles.sectionTitle}>بيانات الشكوى</h3>
              <div className={detailsStyles.infoSection}>
                <div className={detailsStyles.infoItem}>
                  <span className={detailsStyles.infoLabel}>القسم:</span>
                  <span> {complaint.department}</span>
                </div>
                <div className={detailsStyles.infoItem}>
                  <span className={detailsStyles.infoLabel}>تاريخ الإرسال:</span>
                  <span> {formatDateTime(complaint.createdAt)}</span>
                </div>
                <div className={detailsStyles.infoItem}>
                  <span className={detailsStyles.infoLabel}>آخر تحديث:</span>
                  <span> {formatDateTime(complaint.updatedAt)}</span>
                </div>
                <div className={detailsStyles.infoItem}>
                  <span className={detailsStyles.infoLabel}>الحالة الحالية:</span>
                  <span className={`px-2 py-1 rounded text-white text-sm ml-2 ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={detailsStyles.subjectSection}>
            <h3 className={detailsStyles.subjectTitle}>موضوع الشكوى</h3>
            <p className={detailsStyles.subjectText}>{complaint.subject}</p>
          </div>

          <div className={detailsStyles.descSection}>
            <h3 className={detailsStyles.descTitle}>وصف المشكلة</h3>
            <div className={detailsStyles.descContent}>
              <p>{complaint.description}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className={detailsStyles.timelineSection}>
            <h3 className={detailsStyles.timelineTitle}>سجل متابعة الشكوى</h3>
            <div className={detailsStyles.timelineList}>
              {complaint.timeline && complaint.timeline.map((event, index) => (
                <div key={index} className={detailsStyles.timelineItem}>
                  <div className={`${detailsStyles.timelineDot} ${getStatusColor(event.status)}`}></div>
                  <div className={detailsStyles.timelineContent}>
                    <div className={detailsStyles.timelineHeader}>
                      <div className={detailsStyles.timelineInfo}>
                        <p className={detailsStyles.timelineStatus}>{event.status}</p>
                        <p className={detailsStyles.timelineNote}>{event.note}</p>
                        {event.updatedBy && (
                          <p className={detailsStyles.timelineUser}>بواسطة: {event.updatedBy}</p>
                        )}
                      </div>
                      <span className={detailsStyles.timelineTime}>
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Update Status */}
          <div className={detailsStyles.updateSection}>
            <h3 className={detailsStyles.updateTitle}>تحديث حالة الشكوى</h3>
            <div className={detailsStyles.updateForm}>
              <div className={detailsStyles.inputGroup}>
                <label className={detailsStyles.label}>الحالة الجديدة</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={detailsStyles.select}
                >
                  <option value="جديدة">جديدة</option>
                  <option value="تحت المراجعة">تحت المراجعة</option>
                  <option value="قيد المعالجة">قيد المعالجة</option>
                  <option value="تم الحل">تم الحل</option>
                  <option value="مرفوضة">مرفوضة</option>
                </select>
              </div>

              <div className={detailsStyles.inputGroup}>
                <label className={detailsStyles.label}>ملاحظات</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={detailsStyles.textarea}
                  rows="3"
                  placeholder="أضف ملاحظاتك حول هذا التحديث"
                />
              </div>

              <button 
                onClick={handleUpdate} 
                className={detailsStyles.updateBtn}
                disabled={!status}
              >
                تحديث الحالة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetails;