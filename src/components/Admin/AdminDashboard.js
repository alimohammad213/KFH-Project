import React, { useState } from 'react';
import { Settings, LogOut, Bell, Home, FileText, Users, AlertCircle, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import StaffManagement from './StaffManagement';
import DepartmentManagement from './DepartmentManagement';
import ComplaintsManagement from './ComplaintsManagement';
import EscalationSettings from './EscalationSettings';
import SystemLogs from './SystemLogs';

const AdminDashboard = ({ currentUser, logout, data, setData }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const allComplaints = data.complaints;
  const pendingEscalation = allComplaints.filter(c => {
    const hoursSinceCreated = (new Date() - new Date(c.createdAt)) / (1000 * 60 * 60);
    return hoursSinceCreated > 72 && c.status !== 'تم الحل' && c.status !== 'مرفوضة' && !c.escalated;
  });

  const adminStyles = {
    container: "min-h-screen bg-gray-50",
    header: "bg-white shadow-sm border-b",
    headerContent: "max-w-7xl mx-auto px-4",
    headerInner: "flex justify-between items-center h-16",
    headerLeft: "flex items-center",
    logo: "w-8 h-8 text-blue-600 ml-3",
    title: "text-xl font-bold",
    headerRight: "flex items-center space-x-4 space-x-reverse",
    notification: "flex items-center",
    notificationIcon: "w-5 h-5 text-orange-500 ml-2",
    notificationText: "text-sm text-orange-600",
    userName: "text-gray-700",
    logoutBtn: "flex items-center text-gray-700 hover:text-red-600 transition-colors",
    nav: "bg-white border-b",
    navContent: "max-w-7xl mx-auto px-4",
    navInner: "flex space-x-8 space-x-reverse overflow-x-auto",
    navTab: "nav-tab whitespace-nowrap",
    badge: "bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2",
    content: "max-w-7xl mx-auto px-4 py-8",
    dashboardTitle: "text-2xl font-bold mb-6",
    statsGrid: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8",
    statCard: "card",
    statInner: "flex items-center",
    statIcon: "p-3 rounded-full",
    statContent: "mr-4",
    statNumber: "text-2xl font-bold",
    statLabel: "text-gray-600",
    quickActionsGrid: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8",
    quickCard: "card",
    quickTitle: "text-lg font-semibold mb-4",
    recentList: "space-y-3",
    recentItem: "flex justify-between items-center",
    recentInfo: "space-y-1",
    recentTitle: "font-medium text-sm",
    recentMeta: "text-xs text-gray-500",
    statusBadge: "px-2 py-1 rounded text-white text-xs",
    deptStats: "space-y-3",
    deptItem: "flex justify-between items-center",
    deptName: "text-sm",
    deptProgress: "flex items-center gap-2",
    deptCount: "text-sm text-gray-600",
    progressBar: "w-16 bg-gray-200 rounded-full h-2",
    progressFill: "bg-blue-600 h-2 rounded-full",
    alertCard: "bg-red-50 border border-red-200 rounded-lg p-6",
    alertContent: "flex items-center",
    alertIcon: "w-6 h-6 text-red-600 ml-3",
    alertText: "flex-1",
    alertTitle: "font-semibold text-red-800",
    alertDesc: "text-red-700",
    alertBtn: "btn-danger mr-auto"
  };

  const Dashboard = () => (
    <div className="fade-in">
      <h2 className={adminStyles.dashboardTitle}>لوحة التحكم الرئيسية</h2>
      
      {/* Stats */}
      <div className={adminStyles.statsGrid}>
        <div className={adminStyles.statCard}>
          <div className={adminStyles.statInner}>
            <div className={`${adminStyles.statIcon} bg-blue-100`}>
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className={adminStyles.statContent}>
              <p className={adminStyles.statNumber}>{allComplaints.length}</p>
              <p className={adminStyles.statLabel}>إجمالي الشكاوى</p>
            </div>
          </div>
        </div>
        
        <div className={adminStyles.statCard}>
          <div className={adminStyles.statInner}>
            <div className={`${adminStyles.statIcon} bg-yellow-100`}>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className={adminStyles.statContent}>
              <p className={adminStyles.statNumber}>
                {allComplaints.filter(c => c.status === 'جديدة' || c.status === 'تحت المراجعة').length}
              </p>
              <p className={adminStyles.statLabel}>قيد المعالجة</p>
            </div>
          </div>
        </div>
        
        <div className={adminStyles.statCard}>
          <div className={adminStyles.statInner}>
            <div className={`${adminStyles.statIcon} bg-green-100`}>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className={adminStyles.statContent}>
              <p className={adminStyles.statNumber}>
                {allComplaints.filter(c => c.status === 'تم الحل').length}
              </p>
              <p className={adminStyles.statLabel}>تم الحل</p>
            </div>
          </div>
        </div>
        
        <div className={adminStyles.statCard}>
          <div className={adminStyles.statInner}>
            <div className={`${adminStyles.statIcon} bg-red-100`}>
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className={adminStyles.statContent}>
              <p className={adminStyles.statNumber}>{pendingEscalation.length}</p>
              <p className={adminStyles.statLabel}>تحتاج تصعيد</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={adminStyles.quickActionsGrid}>
        <div className={adminStyles.quickCard}>
          <h3 className={adminStyles.quickTitle}>الشكاوى الحديثة</h3>
          <div className={adminStyles.recentList}>
            {allComplaints.slice(0, 5).map(complaint => (
              <div key={complaint.id} className={adminStyles.recentItem}>
                <div className={adminStyles.recentInfo}>
                  <p className={adminStyles.recentTitle}>
                    {complaint.subject.substring(0, 30)}...
                  </p>
                  <p className={adminStyles.recentMeta}>{complaint.patientName}</p>
                </div>
                <span className={`${adminStyles.statusBadge} ${
                  complaint.status === 'تم الحل' ? 'bg-green-500' :
                  complaint.status === 'مرفوضة' ? 'bg-red-500' :
                  complaint.status === 'قيد المعالجة' ? 'bg-orange-500' :
                  complaint.status === 'تحت المراجعة' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}>
                  {complaint.status}
                </span>
              </div>
            ))}
            {allComplaints.length === 0 && (
              <p className="text-gray-500 text-center py-4">لا توجد شكاوى</p>
            )}
          </div>
        </div>

        <div className={adminStyles.quickCard}>
          <h3 className={adminStyles.quickTitle}>إحصائيات الأقسام</h3>
          <div className={adminStyles.deptStats}>
            {data.departments.map(dept => {
              const deptComplaints = allComplaints.filter(c => c.department === dept);
              const percentage = allComplaints.length > 0 ? (deptComplaints.length / allComplaints.length) * 100 : 0;
              return (
                <div key={dept} className={adminStyles.deptItem}>
                  <span className={adminStyles.deptName}>{dept}</span>
                  <div className={adminStyles.deptProgress}>
                    <span className={adminStyles.deptCount}>{deptComplaints.length}</span>
                    <div className={adminStyles.progressBar}>
                      <div 
                        className={adminStyles.progressFill}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Escalation Alert */}
     {pendingEscalation.length > 0 && (
       <div className={adminStyles.alertCard}>
         <div className={adminStyles.alertContent}>
           <AlertCircle className={adminStyles.alertIcon} />
           <div className={adminStyles.alertText}>
             <h3 className={adminStyles.alertTitle}>تنبيه: شكاوى تحتاج تصعيد</h3>
             <p className={adminStyles.alertDesc}>
               يوجد {pendingEscalation.length} شكوى تجاوزت المهلة الزمنية وتحتاج للتصعيد
             </p>
           </div>
           <button
             onClick={() => setActiveTab('escalation')}
             className={adminStyles.alertBtn}
           >
             عرض التفاصيل
           </button>
         </div>
       </div>
     )}
   </div>
 );

 return (
   <div className={adminStyles.container}>
     {/* Header */}
     <div className={adminStyles.header}>
       <div className={adminStyles.headerContent}>
         <div className={adminStyles.headerInner}>
           <div className={adminStyles.headerLeft}>
             <Settings className={adminStyles.logo} />
             <h1 className={adminStyles.title}>نظام الشكاوى - الإدارة</h1>
           </div>
           <div className={adminStyles.headerRight}>
             {pendingEscalation.length > 0 && (
               <div className={adminStyles.notification}>
                 <Bell className={adminStyles.notificationIcon} />
                 <span className={adminStyles.notificationText}>
                   {pendingEscalation.length} شكوى تحتاج تصعيد
                 </span>
               </div>
             )}
             <span className={adminStyles.userName}>مرحباً، {currentUser.name}</span>
             <button onClick={logout} className={adminStyles.logoutBtn}>
               <LogOut className="w-5 h-5 ml-1" />
               خروج
             </button>
           </div>
         </div>
       </div>
     </div>

     {/* Navigation */}
     <div className={adminStyles.nav}>
       <div className={adminStyles.navContent}>
         <nav className={adminStyles.navInner}>
           {[
             { key: 'dashboard', label: 'الرئيسية', icon: Home },
             { key: 'complaints', label: 'إدارة الشكاوى', icon: FileText },
             { key: 'staff', label: 'إدارة الموظفين', icon: Users },
             { key: 'departments', label: 'إدارة الأقسام', icon: Settings },
             { key: 'escalation', label: 'التصعيد', icon: AlertCircle },
             { key: 'logs', label: 'سجل العمليات', icon: Clock }
           ].map(tab => (
             <button
               key={tab.key}
               onClick={() => setActiveTab(tab.key)}
               className={`${adminStyles.navTab} ${
                 activeTab === tab.key ? 'active' : 'inactive'
               }`}
             >
               <tab.icon className="w-5 h-5 ml-2" />
               {tab.label}
               {tab.key === 'escalation' && pendingEscalation.length > 0 && (
                 <span className={adminStyles.badge}>
                   {pendingEscalation.length}
                 </span>
               )}
             </button>
           ))}
         </nav>
       </div>
     </div>

     {/* Content */}
     <div className={adminStyles.content}>
       {selectedComplaint ? (
         <div className="mb-4">
           <button
             onClick={() => setSelectedComplaint(null)}
             className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
           >
             <ChevronRight className="w-5 h-5 ml-1" />
             العودة للقائمة
           </button>
           {/* Complaint Details Component would go here */}
         </div>
       ) : (
         <>
           {activeTab === 'dashboard' && <Dashboard />}
           {activeTab === 'complaints' && (
             <ComplaintsManagement 
               data={data} 
               setData={setData} 
               setSelectedComplaint={setSelectedComplaint}
             />
           )}
           {activeTab === 'staff' && <StaffManagement data={data} setData={setData} />}
           {activeTab === 'departments' && <DepartmentManagement data={data} setData={setData} />}
           {activeTab === 'escalation' && (
             <EscalationSettings 
               data={data} 
               setData={setData} 
               pendingEscalation={pendingEscalation}
             />
           )}
           {activeTab === 'logs' && <SystemLogs data={data} />}
         </>
       )}
     </div>
   </div>
 );
};

export default AdminDashboard;