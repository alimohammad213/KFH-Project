import React, { useState, useEffect } from 'react';
import './App.css';

// Import components
import LoginScreen from './components/Auth/LoginScreen';
import RegisterScreen from './components/Auth/RegisterScreen';
import PatientDashboard from './components/Patient/PatientDashboard';
import StaffDashboard from './components/Staff/StaffDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';

// Import data
import { initialData } from './data/initialData';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('hospitalComplaintData');
      return saved ? JSON.parse(saved) : initialData;
    } catch (error) {
      console.log('Local storage not available, using initial data');
      return initialData;
    }
  });

  // Save data to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('hospitalComplaintData', JSON.stringify(data));
    } catch (error) {
      console.log('Local storage not available, using memory storage');
    }
  }, [data]);

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  const appProps = {
    currentUser,
    setCurrentUser,
    currentView,
    setCurrentView,
    data,
    setData,
    logout
  };

  // Main render logic
  switch (currentView) {
    case 'login':
      return <LoginScreen {...appProps} />;
    case 'register':
      return <RegisterScreen {...appProps} />;
    case 'patient-dashboard':
      return <PatientDashboard {...appProps} />;
    case 'staff-dashboard':
      return <StaffDashboard {...appProps} />;
    case 'admin-dashboard':
      return <AdminDashboard {...appProps} />;
    default:
      return <LoginScreen {...appProps} />;
  }
}

export default App;