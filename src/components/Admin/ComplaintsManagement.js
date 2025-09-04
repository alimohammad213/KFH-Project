import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, FileText, RefreshCw } from 'lucide-react';
import { complaintsService } from '../../services/api';
import { useAppContext } from '../../App';

const ComplaintsManagement = ({ complaints: propComplaints, onRefresh, setSelectedComplaint }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [complaints, setComplaints] = useState(propComplaints || []);
  const [loading, setLoading] = useState(!propComplaints);
  const [showReassignModal, setShowReassignModal] = useState(null);

  const { handleAppError } = useAppContext();

  const complaintsStyles = {
    container: "fade-in",
    header: "flex justify-between items-center mb-6",
    title: "text-xl font-bold",
    refreshBtn: "flex items-center text-blue-600 hover:text-blue-800 text-sm",
    filtersCard: "card mb-6",
    filtersGrid: "flex flex-col md:flex-row gap-4",
    searchInput: "input-field flex-1",
    filterSelect: "input-field",
    complaintsCard: "card",
    cardHeader: "p-6 border-b",
    cardTitle: "text-lg font-semibold",
    cardContent: "p-6",
    emptyState: "text-center py-8",
    emptyIcon: "mx-auto w-16 h-16 text-gray-300 mb-4",
    emptyText: "text-gray-500",
    complaintsList: "space-y-4",
    complaintItem: "border rounded-lg p-4 hover:bg-gray-50 transition-colors",
    complaintHeader: "flex justify-between items-start mb-3",
    complaintInfo: "flex-1",
    complaintTitle: "font-semibold text-lg mb-2",
    complaintMeta: "grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600 mt-2",
    complaintDesc: "text-gray-700 mb-3",
    statusBadge: "px-3 py-1 rounded-full text-white text-sm",
    actionButtons: "flex gap-2",
    viewBtn: "btn-primary text-sm",
    reassignBtn: "bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700",
    modal: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
    modalContent: "bg-white rounded-lg p-6 w-full max-w-md",
    modalTitle: "text-lg font-semibold mb-4",
    modalForm: "space-y-4",
    modalButtons: "flex gap-4",
    loadingSpinner: "flex items-center justify-center py-8",
    spinner: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
  };

  useEffect(() => {
    if (propComplaints) {
      setComplaints(propComplaints);
      setLoading(false);
    } else {
      fetchComplaints();
    }
  }, [propComplaints]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const result = await complaintsService.getComplaints();
      
      if (result.success) {
        setComplaints(result.data.complaints || []);
      } else {
        handleAppError(result.error);
      }
    } catch (error) {
      console.error('خطأ في جلب الشكاوى:', error);
      handleAppError('حدث خطأ في جلب الشكاوى');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await fetchComplaints();
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesFilter = filter === 'all' || complaint.status === filter;
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const reassignComplaint = async (complaintId, newStaffId) => {
    try {
      const result = await complaintsService.assignComplaint(complaintId, {
        assigned_to: newStaffId
      });
      
      if (result.success) {
        alert('تم إعادة تعيين الشكوى بنجاح');
        await handleRefresh();
      } else {
        handleAppError(result.error);
      }
    } catch (error) {
      console.error('خطأ في إعادة تعيين الشكوى:', error);
      handleAppError('حدث خطأ في إعادة تعيين الشكوى');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const ReassignModal = ({ complaint, onClose }) => {
    const [selectedStaff, setSelectedStaff] = useState('');
    const [staffList] = useState([
      { id: 'staff1', name: 'د. سارة أحمد', department_id: 1 },
      { id: 'staff2', name: 'أ. محمد علي', department_id: 2 },
      { id: 'super1', name: 'د. خالد الشمري', department_id: 1 },
      { id: 'super2', name: 'د. فاطمة العتيبي', department_id: 2 },
      { id: 'dm1', name: 'د. نورا المالكي', department_id: 1 },
      { id: 'dm2', name: 'د. سعد الغامدي', department_id: 2 }
    ]);

    const availableStaff = staffList.filter(s => s.department_id === complaint.department_id);

    const handleReassign = async () => {
      if (selectedStaff) {
        await reassignComplaint(complaint.id, selectedStaff);
        onClose();
      }
    };

    return (
      <div className={complaintsStyles.modal}>
        <div className={complaintsStyles.modalContent}>
          <h3 className={complaintsStyles.modalTitle}>إعادة تعيين الشكوى</h3>
          <p className="text-gray-600 mb-4">الشكوى: {complaint.subject}</p>
          
          <div className={complaintsStyles.modalForm}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر الموظف
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="input-field"
              >
                <option value="">اختر موظف</option>
                {availableStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>

            <div className={complaintsStyles.modalButtons}>
              <button
                onClick={handleReassign}
                disabled={!selectedStaff}
                className="btn-primary disabled:bg-gray-400"
              >
                إعادة تعيين
              </button>
              <button onClick={onClose} className="btn-secondary">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={complaintsStyles.container}>
        <div className={complaintsStyles.loadingSpinner}>
          <div className={complaintsStyles.spinner}></div>
          <span className="mr-2">جاري تحميل الشكاوى...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={complaintsStyles.container}>
      <div className={complaintsStyles.header}>
        <h2 className={complaintsStyles.title}>إدارة الشكاوى</h2>
        <button 
          onClick={handleRefresh}
          className={complaintsStyles.refreshBtn}
        >
          <RefreshCw className="w-4 h-4 ml-1" />
          تحديث
        </button>
      </div>
      
      {/* Filters */}
      <div className={complaintsStyles.filtersCard}>
        <div className={complaintsStyles.filtersGrid}>
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الشكاوى..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${complaintsStyles.searchInput} pr-10`}
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={complaintsStyles.filterSelect}
          >
            <option value="all">جميع الشكاوى</option>
            <option value="جديدة">جديدة</option>
            <option value="تحت المراجعة">تحت المراجعة</option>
            <option value="قيد المعالجة">قيد المعالجة</option>
            <option value="تم الحل">تم الحل</option>
            <option value="مرفوضة">مرفوضة</option>
            <option value="متصعدة">متصعدة</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className={complaintsStyles.complaintsCard}>
        <div className={complaintsStyles.cardHeader}>
          <h3 className={complaintsStyles.cardTitle}>
            الشكاوى ({filteredComplaints.length})
          </h3>
        </div>
        <div className={complaintsStyles.cardContent}>
          {filteredComplaints.length === 0 ? (
            <div className={complaintsStyles.emptyState}>
              <FileText className={complaintsStyles.emptyIcon} />
              <p className={complaintsStyles.emptyText}>لا توجد شكاوى</p>
            </div>
          ) : (
            <div className={complaintsStyles.complaintsList}>
              {filteredComplaints
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map(complaint => (
                <div key={complaint.id} className={complaintsStyles.complaintItem}>
                  <div className={complaintsStyles.complaintHeader}>
                    <div className={complaintsStyles.complaintInfo}>
                      <h4 className={complaintsStyles.complaintTitle}>{complaint.subject}</h4>
                      <div className={complaintsStyles.complaintMeta}>
                        <p><strong>المريض:</strong> {complaint.patient_name}</p>
                        <p><strong>القسم:</strong> {complaint.department_name}</p>
                        <p><strong>المعين له:</strong> {complaint.assigned_to_name || 'غير معين'}</p>
                        <p><strong>التاريخ:</strong> {formatDate(complaint.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${complaintsStyles.statusBadge} ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>
                  
                  <p className={complaintsStyles.complaintDesc}>
                    {complaint.description.length > 150 
                      ? complaint.description.substring(0, 150) + '...'
                      : complaint.description
                    }
                  </p>
                  
                  <div className={complaintsStyles.actionButtons}>
                    <button
                      onClick={() => setSelectedComplaint && setSelectedComplaint(complaint)}
                      className={complaintsStyles.viewBtn}
                    >
                      <Eye className="w-4 h-4 inline ml-1" />
                      التفاصيل
                    </button>
                    <button
                      onClick={() => setShowReassignModal(complaint)}
                      className={complaintsStyles.reassignBtn}
                    >
                      <Edit className="w-4 h-4 inline ml-1" />
                      إعادة تعيين
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <ReassignModal
          complaint={showReassignModal}
          onClose={() => setShowReassignModal(null)}
        />
      )}
    </div>
  );
};

export default ComplaintsManagement;