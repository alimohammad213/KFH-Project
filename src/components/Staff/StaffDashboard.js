import React, { useState } from 'react';
import { Users, LogOut, FileText, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import ComplaintDetails from './ComplaintDetails';
import { getStatusColor } from '../../utils/helpers';

const StaffDashboard = ({ currentUser, logout, data, setData }) => {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const staffComplaints = data.complaints.filter(c => c.assignedTo === currentUser.id);

  const staffStyles = {
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
    dashboardTitle: "text-2xl font-bold mb-6",
    statsGrid: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8",
    statCard: "card",
    statInner: "flex items-center",
    statIcon: "p-3 rounded-full",
    statContent: "mr-4",
    statNumber: "text-2xl font-bold",
    statLabel: "text-gray-600",
    complaintsCard: "card",
    cardHeader: "p-6 border-b",
    cardTitle: "text-lg font-semibold",
    cardContent: "p-6",
    emptyState: "text-center py-8",
    emptyIcon: "mx-auto w-16 h-16 text-gray-300 mb-4",
    emptyText: "text-gray-500",
    complaintsList: "space-y-4",
    complaintItem: "border rounded-lg p-4 hover:bg-gray-50 transition-colors",
    complaintHeader: "flex justify-between items-start",
    complaintInfo: "flex-1",
    complaintTitle: "font-semibold text-lg mb-2",
    complaintMeta: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3",
    complaintDesc: "text-gray-700 mb-3",
    statusBadge: "px-3 py-1 rounded-full text-white text-sm",
    viewBtn: "btn-primary"
  };

  const updateComplaintStatus = (complaintId, newStatus, note = '') => {
    setData(prev => ({
      ...prev,
      complaints: prev.complaints.map(complaint => {
        if (complaint.id === complaintId) {
          const updatedComplaint = {
            ...complaint,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            timeline: [...complaint.timeline, {
              status: newStatus,
              timestamp: new Date().toISOString(),
              note: note || `تم تحديث الحالة إلى: ${newStatus}`,
              updatedBy: currentUser.name
            }]
          };
          return updatedComplaint;
        }
        return complaint;
      })
    }));
  };

  if (selectedComplaint) {
    return (
      <ComplaintDetails
        complaint={selectedComplaint}
        currentUser={currentUser}
        updateComplaintStatus={updateComplaintStatus}
        onBack={() => setSelectedComplaint(null)}
        logout={logout}
      />
    );
  }

  return (
    <div className={staffStyles.container}>
      {/* Header */}
      <div className={staffStyles.header}>
        <div className={staffStyles.headerContent}>
          <div className={staffStyles.headerInner}>
            <div className={staffStyles.headerLeft}>
              <Users className={staffStyles.logo} />
              <h1 className={staffStyles.title}>نظام الشكاوى - الموظف</h1>
            </div>
            <div className={staffStyles.headerRight}>
              <div className="text-right">
                <span className={staffStyles.userName}>مرحباً، {currentUser.name}</span>
                <div className={staffStyles.userDept}>({currentUser.department})</div>
              </div>
              <button onClick={logout} className={staffStyles.logoutBtn}>
                <LogOut className="w-5 h-5 ml-1" />
                خروج
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={staffStyles.content}>
        <div className="fade-in">
          <h2 className={staffStyles.dashboardTitle}>الشكاوى المعينة لي</h2>
          
          {/* Stats */}
          <div className={staffStyles.statsGrid}>
            <div className={staffStyles.statCard}>
              <div className={staffStyles.statInner}>
                <div className={`${staffStyles.statIcon} bg-blue-100`}>
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className={staffStyles.statContent}>
                  <p className={staffStyles.statNumber}>{staffComplaints.length}</p>
                  <p className={staffStyles.statLabel}>إجمالي الشكاوى</p>
                </div>
              </div>
            </div>
            
            <div className={staffStyles.statCard}>
              <div className={staffStyles.statInner}>
                <div className={`${staffStyles.statIcon} bg-yellow-100`}>
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className={staffStyles.statContent}>
                  <p className={staffStyles.statNumber}>
                    {staffComplaints.filter(c => c.status === 'جديدة').length}
                  </p>
                  <p className={staffStyles.statLabel}>جديدة</p>
                </div>
              </div>
            </div>
            
            <div className={staffStyles.statCard}>
              <div className={staffStyles.statInner}>
                <div className={`${staffStyles.statIcon} bg-orange-100`}>
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div className={staffStyles.statContent}>
                  <p className={staffStyles.statNumber}>
                    {staffComplaints.filter(c => c.status === 'قيد المعالجة' || c.status === 'تحت المراجعة').length}
                  </p>
                  <p className={staffStyles.statLabel}>قيد المعالجة</p>
                </div>
              </div>
            </div>
            
            <div className={staffStyles.statCard}>
              <div className={staffStyles.statInner}>
                <div className={`${staffStyles.statIcon} bg-green-100`}>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className={staffStyles.statContent}>
                  <p className={staffStyles.statNumber}>
                    {staffComplaints.filter(c => c.status === 'تم الحل').length}
                  </p>
                  <p className={staffStyles.statLabel}>تم الحل</p>
                </div>
              </div>
            </div>
          </div>

          {/* Complaints List */}
          <div className={staffStyles.complaintsCard}>
            <div className={staffStyles.cardHeader}>
              <h3 className={staffStyles.cardTitle}>قائمة الشكاوى</h3>
            </div>
            <div className={staffStyles.cardContent}>
              {staffComplaints.length === 0 ? (
                <div className={staffStyles.emptyState}>
                  <FileText className={staffStyles.emptyIcon} />
                  <p className={staffStyles.emptyText}>لا توجد شكاوى معينة لك حالياً</p>
                </div>
              ) : (
                <div className={staffStyles.complaintsList}>
                  {staffComplaints.map(complaint => (
                    <div key={complaint.id} className={staffStyles.complaintItem}>
                      <div className={staffStyles.complaintHeader}>
                        <div className={staffStyles.complaintInfo}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={staffStyles.complaintTitle}>{complaint.subject}</h4>
                            <span className={`${staffStyles.statusBadge} ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </div>
                          <div className={staffStyles.complaintMeta}>
                            <p><strong>المريض:</strong> {complaint.patientName}</p>
                            <p><strong>الجوال:</strong> {complaint.patientPhone}</p>
                            <p><strong>التاريخ:</strong> {new Date(complaint.createdAt).toLocaleDateString('ar-SA')}</p>
                          </div>
                          <p className={staffStyles.complaintDesc}>
                            {complaint.description.substring(0, 150)}...
                          </p>
                          <button
                            onClick={() => setSelectedComplaint(complaint)}
                            className={staffStyles.viewBtn}
                          >
                            <Eye className="w-4 h-4 inline ml-1" />
                            عرض التفاصيل
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;