import React, { useState } from 'react';
import { Search, Eye, Edit, FileText } from 'lucide-react';
import { getStatusColor, formatDate } from '../../utils/helpers';
import { useAppContext } from '../../App';

const ComplaintsManagement = ({ setSelectedComplaint }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(null);

  const { data, setData } = useAppContext();

  const complaintsStyles = {
    container: "fade-in",
    title: "text-xl font-bold mb-6",
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
    complaintItem: "border rounded-lg p-4",
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
    modalButtons: "flex gap-4"
  };

  const filteredComplaints = data.complaints.filter(complaint => {
    const matchesFilter = filter === 'all' || complaint.status === filter;
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const reassignComplaint = (complaintId, newStaffId) => {
    const newStaff = data.staff.find(s => s.id === newStaffId);
    setData(prev => ({
      ...prev,
      complaints: prev.complaints.map(complaint => {
        if (complaint.id === complaintId) {
          return {
            ...complaint,
            assignedTo: newStaffId,
            updatedAt: new Date().toISOString(),
            timeline: [...complaint.timeline, {
              status: 'إعادة تعيين',
              timestamp: new Date().toISOString(),
              note: `تم إعادة تعيين الشكوى للموظف: ${newStaff?.name}`,
              updatedBy: 'المدير'
            }]
          };
        }
        return complaint;
      })
    }));
  };

  const ReassignModal = ({ complaint, onClose }) => {
    const [selectedStaff, setSelectedStaff] = useState('');
    const availableStaff = data.staff.filter(s => s.department === complaint.department);

    const handleReassign = () => {
      if (selectedStaff) {
        reassignComplaint(complaint.id, selectedStaff);
        alert('تم إعادة تعيين الشكوى بنجاح');
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

  return (
    <div className={complaintsStyles.container}>
      <h2 className={complaintsStyles.title}>إدارة الشكاوى</h2>
      
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
              {filteredComplaints.map(complaint => {
                const assignedStaff = data.staff.find(s => s.id === complaint.assignedTo);
                return (
                  <div key={complaint.id} className={complaintsStyles.complaintItem}>
                    <div className={complaintsStyles.complaintHeader}>
                      <div className={complaintsStyles.complaintInfo}>
                        <h4 className={complaintsStyles.complaintTitle}>{complaint.subject}</h4>
                        <div className={complaintsStyles.complaintMeta}>
                          <p><strong>المريض:</strong> {complaint.patientName}</p>
                          <p><strong>القسم:</strong> {complaint.department}</p>
                          <p><strong>المعين له:</strong> {assignedStaff?.name || 'غير معين'}</p>
                          <p><strong>التاريخ:</strong> {formatDate(complaint.createdAt)}</p>
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
                );
              })}
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