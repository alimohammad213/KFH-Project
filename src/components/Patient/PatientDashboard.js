import React, { useState } from 'react';
import { FileText, Home, Plus, LogOut, CheckCircle, Clock } from 'lucide-react';
import NewComplaintForm from './NewComplaintForm';
import ComplaintsList from './ComplaintsList';
import { getStatusColor } from '../../utils/helpers';
import { useAppContext } from '../../App'; // استيراد الـ Context

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // استخدام البيانات من الـ Context بدلاً من إعادة التهيئة
  const { currentUser, logout, userComplaints } = useAppContext();

  const patientStyles = {
    container: "min-h-screen bg-gray-50",
    header: "bg-white shadow-sm border-b",
    headerContent: "max-w-7xl mx-auto px-4",
    headerInner: "flex justify-between items-center h-16",
    headerLeft: "flex items-center",
    logo: "w-8 h-8 text-blue-600 ml-3",
    title: "text-xl font-bold",
    headerRight: "flex items-center space-x-4 space-x-reverse",
    userName: "text-gray-700",
    logoutBtn: "flex items-center text-gray-700 hover:text-red-600 transition-colors",
    nav: "bg-white border-b",
    navContent: "max-w-7xl mx-auto px-4",
    navInner: "flex space-x-8 space-x-reverse",
    navTab: "nav-tab",
    content: "max-w-7xl mx-auto px-4 py-8",
    statsGrid: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8",
    statCard: "card",
    statInner: "flex items-center",
    statIcon: "p-3 rounded-full",
    statContent: "mr-4",
    statNumber: "text-2xl font-bold",
    statLabel: "text-gray-600",
    dashboardCard: "card",
    cardTitle: "text-lg font-semibold mb-4",
    recentItem: "flex justify-between items-center py-3 border-b last:border-b-0",
    recentInfo: "space-y-1",
    recentTitle: "font-medium",
    recentDept: "text-sm text-gray-600",
    statusBadge: "px-3 py-1 rounded-full text-white text-sm"
  };

  const Dashboard = () => (
    <div className="fade-in">
      <h2 className="text-2xl font-bold mb-6">لوحة التحكم</h2>
      
      {/* الإحصائيات */}
      <div className={patientStyles.statsGrid}>
        <div className={patientStyles.statCard}>
          <div className={patientStyles.statInner}>
            <div className={`${patientStyles.statIcon} bg-blue-100`}>
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className={patientStyles.statContent}>
              <p className={patientStyles.statNumber}>{userComplaints.length}</p>
              <p className={patientStyles.statLabel}>إجمالي الشكاوى</p>
            </div>
          </div>
        </div>
        
        <div className={patientStyles.statCard}>
          <div className={patientStyles.statInner}>
            <div className={`${patientStyles.statIcon} bg-green-100`}>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className={patientStyles.statContent}>
              <p className={patientStyles.statNumber}>
                {userComplaints.filter(c => c.status === 'تم الحل').length}
              </p>
              <p className={patientStyles.statLabel}>تم الحل</p>
            </div>
          </div>
        </div>
        
        <div className={patientStyles.statCard}>
          <div className={patientStyles.statInner}>
            <div className={`${patientStyles.statIcon} bg-yellow-100`}>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className={patientStyles.statContent}>
              <p className={patientStyles.statNumber}>
                {userComplaints.filter(c => c.status !== 'تم الحل' && c.status !== 'مرفوضة').length}
              </p>
              <p className={patientStyles.statLabel}>قيد المعالجة</p>
            </div>
          </div>
        </div>
      </div>

      {/* آخر الشكاوى */}
      <div className={patientStyles.dashboardCard}>
        <h3 className={patientStyles.cardTitle}>آخر الشكاوى</h3>
        {userComplaints.slice(0, 3).map(complaint => (
          <div key={complaint.id} className={patientStyles.recentItem}>
            <div className={patientStyles.recentInfo}>
              <p className={patientStyles.recentTitle}>{complaint.subject}</p>
              <p className={patientStyles.recentDept}>{complaint.department}</p>
            </div>
            <span className={`${patientStyles.statusBadge} ${getStatusColor(complaint.status)}`}>
              {complaint.status}
            </span>
          </div>
        ))}
        {userComplaints.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">لا توجد شكاوى</p>
            <button 
              onClick={() => setActiveTab('new-complaint')}
              className="btn-primary mt-4"
            >
              إرسال شكوى جديدة
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // التحقق من وجود المستخدم
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">جلسة منتهية</h2>
          <p className="text-gray-600 mb-4">يرجى تسجيل الدخول مرة أخرى</p>
          <button onClick={logout} className="btn-primary">
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={patientStyles.container}>
      {/* الهيدر */}
      <div className={patientStyles.header}>
        <div className={patientStyles.headerContent}>
          <div className={patientStyles.headerInner}>
            <div className={patientStyles.headerLeft}>
              <FileText className={patientStyles.logo} />
              <h1 className={patientStyles.title}>نظام الشكاوى - المريض</h1>
            </div>
            <div className={patientStyles.headerRight}>
              <span className={patientStyles.userName}>مرحباً، {currentUser.name}</span>
              <button onClick={logout} className={patientStyles.logoutBtn}>
                <LogOut className="w-5 h-5 ml-1" />
                خروج
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* التنقل */}
      <div className={patientStyles.nav}>
        <div className={patientStyles.navContent}>
          <nav className={patientStyles.navInner}>
            {[ 
              { key: 'dashboard', label: 'الرئيسية', icon: Home },
              { key: 'new-complaint', label: 'شكوى جديدة', icon: Plus },
              { key: 'complaints', label: 'شكاويّ', icon: FileText }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${patientStyles.navTab} ${activeTab === tab.key ? 'active' : 'inactive'}`}
              >
                <tab.icon className="w-5 h-5 ml-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* المحتوى */}
      <div className={patientStyles.content}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'new-complaint' && (
          <NewComplaintForm setActiveTab={setActiveTab} />
        )}
        {activeTab === 'complaints' && (
          <ComplaintsList userComplaints={userComplaints} />
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;