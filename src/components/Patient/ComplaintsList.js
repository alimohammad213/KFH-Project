import React, { useState } from 'react';
import { FileText, RefreshCw, Eye, Clock } from 'lucide-react';

const ComplaintsList = ({ complaints, loading, onRefresh }) => {
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const listStyles = {
    container: "fade-in",
    header: "flex justify-between items-center mb-6",
    title: "text-xl font-bold",
    refreshBtn: "flex items-center text-blue-600 hover:text-blue-800 text-sm",
    emptyState: "text-center py-8",
    emptyIcon: "mx-auto w-16 h-16 text-gray-300 mb-4",
    emptyText: "text-gray-500",
    complaintsGrid: "space-y-4",
    complaintCard: "bg-white rounded-lg shadow p-4 border-r-4 transition-colors hover:shadow-md",
    complaintHeader: "flex justify-between items-start mb-3",
    complaintInfo: "flex-1 space-y-1",
    complaintTitle: "font-semibold text-lg",
    complaintMeta: "text-sm text-gray-600",
    statusBadge: "px-3 py-1 rounded-full text-white text-sm whitespace-nowrap",
    complaintDesc: "bg-gray-50 rounded p-3 mb-3",
    complaintText: "text-sm",
    complaintActions: "flex justify-between items-center",
    viewBtn: "btn-primary text-sm",
    complaintDate: "text-xs text-gray-400",
    loadingSpinner: "flex items-center justify-center py-8",
    spinner: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600",
    modal: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
    modalCard: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto",
    modalHeader: "p-6 border-b flex justify-between items-center",
    modalTitle: "text-xl font-bold",
    modalClose: "text-gray-400 hover:text-gray-600 text-2xl",
    modalContent: "p-6"
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

  // دالة للحصول على لون الحد الجانبي
  const getBorderColor = (status) => {
    const colors = {
      'جديدة': 'border-blue-500',
      'تحت المراجعة': 'border-yellow-500',
      'قيد المعالجة': 'border-orange-500',
      'تم الحل': 'border-green-500',
      'مرفوضة': 'border-red-500',
      'متصعدة': 'border-purple-500'
    };
    return colors[status] || 'border-gray-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ComplaintModal = ({ complaint, onClose }) => (
    <div className={listStyles.modal} onClick={onClose}>
      <div className={listStyles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={listStyles.modalHeader}>
          <h3 className={listStyles.modalTitle}>تفاصيل الشكوى</h3>
          <button onClick={onClose} className={listStyles.modalClose}>×</button>
        </div>
        <div className={listStyles.modalContent}>
          <div className="space-y-4">
            <div>
              <span className="font-semibold">رقم الشكوى:</span>
              <span className="mr-2">{complaint.id}</span>
            </div>
            <div>
              <span className="font-semibold">الموضوع:</span>
              <span className="mr-2">{complaint.subject}</span>
            </div>
            <div>
              <span className="font-semibold">القسم:</span>
              <span className="mr-2">{complaint.department_name}</span>
            </div>
            <div>
              <span className="font-semibold">الأولوية:</span>
              <span className="mr-2">{complaint.priority}</span>
            </div>
            <div>
              <span className="font-semibold">الحالة:</span>
              <span className={`mr-2 ${listStyles.statusBadge} ${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
            </div>
            <div>
              <span className="font-semibold">تاريخ الإرسال:</span>
              <span className="mr-2">{formatDate(complaint.created_at)}</span>
            </div>
            <div>
              <span className="font-semibold">وصف المشكلة:</span>
              <div className="mt-2 p-3 bg-gray-50 rounded">
                {complaint.description}
              </div>
            </div>
            {complaint.assigned_to_name && (
              <div>
                <span className="font-semibold">معين إلى:</span>
                <span className="mr-2">{complaint.assigned_to_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={listStyles.container}>
        <div className={listStyles.loadingSpinner}>
          <div className={listStyles.spinner}></div>
          <span className="mr-2">جاري تحميل الشكاوى...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={listStyles.container}>
      <div className={listStyles.header}>
        <h2 className={listStyles.title}>شكاويّ المرسلة</h2>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className={listStyles.refreshBtn}
          >
            <RefreshCw className="w-4 h-4 ml-1" />
            تحديث
          </button>
        )}
      </div>

      {complaints.length === 0 ? (
        <div className={listStyles.emptyState}>
          <FileText className={listStyles.emptyIcon} />
          <p className={listStyles.emptyText}>لم تقم بإرسال أي شكاوى بعد</p>
          <p className="text-sm text-gray-400 mt-2">
            يمكنك إرسال شكوى جديدة من خلال تبويب "شكوى جديدة"
          </p>
        </div>
      ) : (
        <div className={listStyles.complaintsGrid}>
          {complaints
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(complaint => (
            <div 
              key={complaint.id} 
              className={`${listStyles.complaintCard} ${getBorderColor(complaint.status)}`}
            >
              <div className={listStyles.complaintHeader}>
                <div className={listStyles.complaintInfo}>
                  <h3 className={listStyles.complaintTitle}>{complaint.subject}</h3>
                  <p className={listStyles.complaintMeta}>
                    القسم: {complaint.department_name}
                  </p>
                  <p className={listStyles.complaintMeta}>
                    الأولوية: {complaint.priority}
                  </p>
                  <p className={listStyles.complaintMeta}>
                    رقم الشكوى: {complaint.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`${listStyles.statusBadge} ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                  {complaint.assigned_to_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      معين إلى: {complaint.assigned_to_name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className={listStyles.complaintDesc}>
                <p className={listStyles.complaintText}>
                  {complaint.description.length > 150 
                    ? complaint.description.substring(0, 150) + '...'
                    : complaint.description
                  }
                </p>
              </div>

              <div className={listStyles.complaintActions}>
                <button
                  onClick={() => setSelectedComplaint(complaint)}
                  className={listStyles.viewBtn}
                >
                  <Eye className="w-4 h-4 inline ml-1" />
                  عرض التفاصيل
                </button>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 ml-1" />
                  {formatDate(complaint.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal للتفاصيل */}
      {selectedComplaint && (
        <ComplaintModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  );
};

export default ComplaintsList;