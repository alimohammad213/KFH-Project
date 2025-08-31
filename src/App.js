import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Import components
import LoginScreen from './components/Auth/LoginScreen';
import RegisterScreen from './components/Auth/RegisterScreen';
import PatientDashboard from './components/Patient/PatientDashboard';
import StaffDashboard from './components/Staff/StaffDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';

// Import data
import { initialData } from './data/initialData';

// إنشاء Context للبيانات العامة
const AppContext = createContext();

// Hook لاستخدام البيانات العامة
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext يجب استخدامه داخل AppProvider');
  }
  return context;
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  
  // إدارة البيانات المركزية - هذا هو الإصلاح الرئيسي
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('hospitalComplaintData');
      return saved ? JSON.parse(saved) : initialData;
    } catch (error) {
      console.log('Local storage not available, using initial data');
      return initialData;
    }
  });

  // حفظ البيانات تلقائياً عند التغيير
  useEffect(() => {
    try {
      localStorage.setItem('hospitalComplaintData', JSON.stringify(data));
      console.log('تم حفظ البيانات:', {
        users: data.users.length,
        staff: data.staff.length,
        complaints: data.complaints.length
      });
    } catch (error) {
      console.log('Local storage not available, using memory storage');
    }
  }, [data]);

  // وظائف مساعدة لتحديث البيانات
  const updateComplaint = (complaintId, updates) => {
    setData(prev => ({
      ...prev,
      complaints: prev.complaints.map(complaint =>
        complaint.id === complaintId
          ? { ...complaint, ...updates, updatedAt: new Date().toISOString() }
          : complaint
      )
    }));
  };

  const addComplaint = (newComplaint) => {
    setData(prev => ({
      ...prev,
      complaints: [...prev.complaints, {
        ...newComplaint,
        id: newComplaint.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]
    }));
  };

  const addUser = (newUser) => {
    setData(prev => ({
      ...prev,
      users: [...prev.users, {
        ...newUser,
        createdAt: new Date().toISOString()
      }]
    }));
  };

  const addStaff = (newStaff) => {
    setData(prev => ({
      ...prev,
      staff: [...prev.staff, {
        ...newStaff,
        id: newStaff.id || Date.now().toString()
      }]
    }));
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    console.log('تم تسجيل الخروج');
  };

  // البيانات المشتركة لجميع المكونات
  const appContextValue = {
    // البيانات
    data,
    setData,
    
    // المستخدم الحالي
    currentUser,
    setCurrentUser,
    
    // العرض الحالي
    currentView,
    setCurrentView,
    
    // الوظائف المساعدة
    updateComplaint,
    addComplaint,
    addUser,
    addStaff,
    logout,
    
    // بيانات مفلترة للمستخدم الحالي
    userComplaints: currentUser ? data.complaints.filter(c => c.patientId === currentUser.id) : [],
    staffComplaints: currentUser ? data.complaints.filter(c => c.assignedTo === currentUser.id) : [],
  };

  // تحديد المكون المناسب حسب العرض
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <LoginScreen />;
      
      case 'register':
        return <RegisterScreen />;
      
      case 'patient-dashboard':
        if (!currentUser || currentUser.role !== 'patient') {
          setCurrentView('login');
          return <LoginScreen />;
        }
        return <PatientDashboard />;
      
      case 'staff-dashboard':
        if (!currentUser || !['staff', 'supervisor', 'manager'].includes(currentUser.role)) {
          setCurrentView('login');
          return <LoginScreen />;
        }
        return <StaffDashboard />;
      
      case 'admin-dashboard':
        if (!currentUser || currentUser.role !== 'admin') {
          setCurrentView('login');
          return <LoginScreen />;
        }
        return <AdminDashboard />;
      
      default:
        return <LoginScreen />;
    }
  };

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="App">
        {renderCurrentView()}
      </div>
    </AppContext.Provider>
  );
}

export default App;