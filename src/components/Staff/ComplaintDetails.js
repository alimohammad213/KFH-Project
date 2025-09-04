import React, { useState, useEffect } from 'react';
import { X, Users, LogOut } from 'lucide-react';
import { complaintsService } from '../../services/api';
import { useAppContext } from '../../App';

const ComplaintDetails = ({ complaint, onBack, updateComplaintStatus }) => {
  const [status, setStatus] = useState(complaint?.status || 'جديدة');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [complaintDetails, setComplaintDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const { currentUser, logout, handleAppError } = useAppContext();

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
    updateBtn: "btn-primary",
    updateBtnDisabled: "btn-primary opacity-50 cursor-not-allowed",
    loadingSpinner: "flex items-center justify-center py-8",
    spinner: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
  };

  // جلب تفاصيل الشكوى الكاملة عند التحميل
  useEffect(() => {
    if (complaint?.id) {
      fetchComplaintDetails();
    }
  }, [complaint?.id]);

  const fetchComplaintDetails = async () => {
    try {
      setLoadingDetails(true);
      const result = await complaintsService.getComplaintDetails(complaint.id);
      
      if (result.success) {
        setComplaintDetails(result.data);
        setStatus(result.data.complaint.status);
      } else {
        handleAppError(result.error);
      }
    } catch (error) {
      console.error('خطأ في جلب تفاصيل الشكوى:', error);
      handleAppError('حدث خطأ في جلب تفاصيل الشكوى');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdate = async () => {
    if (!complaint?.id) return;
    
    setLoading(true);
    
    try {
      const result = await complaintsService.updateComplaintStatus(complaint.id, {
        status: status,
        note: note || `تم تحديث الحالة إلى: ${status}`
      });

      if (result.success) {
        alert('تم تحديث حالة الشكوى بنجاح');
        setNote('');
        
        // تحديث الشكوى في الواجهة
        if (updateComplaintStatus) {
          updateComplaintStatus(complaint.id, status, note);
        }
        
        // إعادة جلب التفاصيل لتحديث التايم لاين
        await fetchComplaintDetails();
      } else {
        handleAppError(result.error);
      }
    } catch (error) {
      console.error('خطأ في تحديث الشكوى:', error);
      handleAppError('حدث خطأ في تحديث الشكوى');
    } finally {
      setLoading(false);
    }
  };

  // دالة للحصول على لون الحالة
  const getStatusColor = (status) => {
    const colors = {
      'جديدة': 'bg-blue-500',
      'تحت المراجعة': 'bg-yellow-500',
      'قيد المعالجة': 'bg-orange-500',
      'تم الحل': 'bg-green-500',
      'مرفوضة': 'bg-red-500',
      'متصعدة': 'bg-purple-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                <div className={detailsStyles.userDept}>
                  ({currentUser.department_name || currentUser.role})
                </div>
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

        {loadingDetails ? (
          <div className={detailsStyles.loadingSpinner}>
            <div className={detailsStyles.spinner}></div>
            <span className="mr-2">جاري تحميل تفاصيل الشكوى...</span>
          </div>
        ) : (
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
                    <span> {complaintDetails?.complaint.patient_name || complaint.patient_name}</span>
                  </div>
                  <div className={detailsStyles.infoItem}>
                    <span className={detailsStyles.infoLabel}>رقم الجوال:</span>
                    <span> {complaintDetails?.complaint.patient_phone || 'غير متوفر'}</span>
                  </div>
                  <div className={detailsStyles.infoItem}>
                    <span className={detailsStyles.infoLabel}>رقم الهوية:</span>
                    <span> {complaintDetails?.complaint.patient_id || complaint.patient_id}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className={detailsStyles.sectionTitle}>بيانات الشكوى</h3>
                <div className={detailsStyles.infoSection}>
                  <div className={detailsStyles.infoItem}>
                    <span className={detailsStyles.infoLabel}>رقم الشكوى:</span>
                    <span> {complaint.id}</span>
                  </div>
                  <div className={detailsStyles.infoItem}>
                    <span className={detailsStyles.infoLabel}>القسم:</span>
                    <span> {complaintDetails?.complaint.department_name || complaint.department_name}</span>
                  </div>
                  <div className={detailsStyles.infoItem}>
                    <span className={detailsStyles.infoLabel}>الأولوية:</span>
                    <span> {complaintDetails?.complaint.priority || complaint.priority || 'متوسط'}</span>
                  </div>
                  <div className={detailsStyles.infoItem}>
                    <span className={detailsStyles.infoLabel}>تاريخ الإرسال:</span>
                    <span> {formatDateTime(complaint.created_at)}</span>
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
            {complaintDetails?.timeline && complaintDetails.timeline.length > 0 && (
              <div className={detailsStyles.timelineSection}>
                <h3 className={detailsStyles.timelineTitle}>سجل متابعة الشكوى</h3>
                <div className={detailsStyles.timelineList}>
                  {complaintDetails.timeline
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((event, index) => (
                    <div key={index} className={detailsStyles.timelineItem}>
                      <div className={`${detailsStyles.timelineDot} ${getStatusColor(event.status)}`}></div>
                      <div className={detailsStyles.timelineContent}>
                        <div className={detailsStyles.timelineHeader}>
                          <div className={detailsStyles.timelineInfo}>
                            <p className={detailsStyles.timelineStatus}>{event.status}</p>
                            {event.note && <p className={detailsStyles.timelineNote}>{event.note}</p>}
                            {event.updated_by_name && (
                              <p className={detailsStyles.timelineUser}>بواسطة: {event.updated_by_name}</p>
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
            )}

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
                    disabled={loading}
                  >
                    <option value="جديدة">جديدة</option>
                    <option value="تحت المراجعة">تحت المراجعة</option>
                    <option value="قيد المعالجة">قيد المعالجة</option>
                    <option value="تم الحل">تم الحل</option>
                    <option value="مرفوضة">مرفوضة</option>
                    <option value="متصعدة">متصعدة</option>
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
                    disabled={loading}
                  />
                </div>

                <button 
                  onClick={handleUpdate} 
                  className={loading || !status ? detailsStyles.updateBtnDisabled : detailsStyles.updateBtn}
                  disabled={loading || !status}
                >
                  {loading ? 'جاري التحديث...' : 'تحديث الحالة'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetails;