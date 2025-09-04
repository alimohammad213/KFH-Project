import React, { useState, useEffect } from 'react';
import { Users, LogOut, FileText, CheckCircle, Clock, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import ComplaintDetails from './ComplaintDetails';
import { complaintsService } from '../../services/api';
import { useAppContext } from '../../App';

const StaffDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { currentUser, logout, handleAppError } = useAppContext();

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
    refreshBtn: "flex items-center text-blue-600 hover:text-blue-800 text-sm ml-4",
    statsGrid: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8",
    statCard: "card",
    statInner: "flex items-center",
    statIcon: "p-3 rounded-full",
    statContent: "mr-4",
    statNumber: "text-2xl font-bold",
    statLabel: "text-gray-600",
    complaintsCard: "card",
    cardHeader: "p-6 border-b flex justify-between items-center",
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
    viewBtn: "btn-primary",
    errorAlert: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6",
    loadingSpinner: "flex items-center justify-center py-8",
    spinner: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
  };

  // جلب الشكاوى عند تحميل المكون
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      
      // جلب الشكاوى المعينة للمستخدم الحالي
      const result = await complaintsService.getMyComplaints();
      
      if (result.success) {
        setComplaints(result.data.complaints || []);
      } else {
        setError(result.error);
        handleAppError(result.error);
      }
    } catch (error) {
      console.error('خطأ في جلب الشكاوى:', error);
      setError('حدث خطأ في جلب الشكاوى');
      handleAppError('حدث خطأ في جلب الشكاوى');
    } finally {
      setLoading(false);
    }
  };

  const refreshComplaints = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  // تحديث حالة الشكوى
  const updateComplaintStatus = async (complaintId, newStatus, note = '') => {
    try {
      const result = await complaintsService.updateComplaintStatus(complaintId, {
        status: newStatus,
        note
      });
      
      if (result.success) {
        // تحديث الشكوى في القائمة المحلية
        setComplaints(prev => prev.map(complaint =>
          complaint.id === complaintId
            ? { ...complaint, status: newStatus }
            : complaint
        ));
        
        // تحديث الشكوى المحددة إذا كانت مفتوحة
        if (selectedComplaint && selectedComplaint.id === complaintId) {
          setSelectedComplaint(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        handleAppError(result.error);
      }
    } catch (error) {
      console.error('خطأ في تحديث الشكوى:', error);
      handleAppError('حدث خطأ في تحديث الشكوى');
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

  // التحقق من وجود المستخدم والصلاحيات
  if (!currentUser || !['staff', 'supervisor', 'manager'].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">غير مصرح لك</h2>
          <p className="text-gray-600 mb-4">يجب أن تكون موظف للوصول لهذه الصفحة</p>
          <button onClick={logout} className="btn-primary">
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

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
                <div className={staffStyles.userDept}>
                  ({currentUser.department_name || currentUser.role})
                </div>
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
          <div className="flex justify-between items-center mb-6">
            <h2 className={staffStyles.dashboardTitle}>الشكاوى المعينة لي</h2>
            <button 
              onClick={refreshComplaints}
              disabled={refreshing}
              className={staffStyles.refreshBtn}
            >
              <RefreshCw className={`w-4 h-4 ml-1 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={staffStyles.errorAlert}>
              {error}
            </div>
          )}
          
          {/* Loading State */}
          {loading ? (
            <div className={staffStyles.loadingSpinner}>
              <div className={staffStyles.spinner}></div>
              <span className="mr-2">جاري تحميل الشكاوى...</span>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className={staffStyles.statsGrid}>
                <div className={staffStyles.statCard}>
                  <div className={staffStyles.statInner}>
                    <div className={`${staffStyles.statIcon} bg-blue-100`}>
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className={staffStyles.statContent}>
                      <p className={staffStyles.statNumber}>{complaints.length}</p>
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
                        {complaints.filter(c => c.status === 'جديدة').length}
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
                        {complaints.filter(c => ['قيد المعالجة', 'تحت المراجعة'].includes(c.status)).length}
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
                        {complaints.filter(c => c.status === 'تم الحل').length}
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
                  {complaints.length === 0 ? (
                    <div className={staffStyles.emptyState}>
                      <FileText className={staffStyles.emptyIcon} />
                      <p className={staffStyles.emptyText}>لا توجد شكاوى معينة لك حالياً</p>
                      <p className="text-sm text-gray-400 mt-2">
                        سيتم تعيين الشكاوى الجديدة تلقائياً حسب قسمك
                      </p>
                    </div>
                  ) : (
                    <div className={staffStyles.complaintsList}>
                      {complaints
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .map(complaint => (
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
                                <p><strong>المريض:</strong> {complaint.patient_name}</p>
                                <p><strong>رقم الشكوى:</strong> {complaint.id}</p>
                                <p><strong>التاريخ:</strong> {new Date(complaint.created_at).toLocaleDateString('ar-SA')}</p>
                              </div>
                              <p className={staffStyles.complaintDesc}>
                                {complaint.description.length > 150 
                                  ? complaint.description.substring(0, 150) + '...'
                                  : complaint.description
                                }
                              </p>
                              <div className="mt-3">
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;