// src/utils/helpers.js - الملف الكامل المحدث
export const getStatusColor = (status) => {
  const colors = {
    'جديدة': 'status-new',
    'تحت المراجعة': 'status-review',
    'قيد المعالجة': 'status-processing',
    'تم الحل': 'status-resolved',
    'مرفوضة': 'status-rejected',
    'متصعدة': 'status-escalated'
  };
  return colors[status] || 'bg-gray-500';
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ar-SA');
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('ar-SA');
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const autoAssignComplaint = (complaint, staff) => {
  const availableStaff = staff.filter(s => s.department === complaint.department);
  if (availableStaff.length > 0) {
    return availableStaff[Math.floor(Math.random() * availableStaff.length)];
  }
  return null;
};

export const checkEscalation = (complaint, escalationHours = 0.017) => {
  const hoursSinceCreated = (new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60);
  return hoursSinceCreated > escalationHours && 
         complaint.status !== 'تم الحل' && 
         complaint.status !== 'مرفوضة' && 
         !complaint.escalated;
};

export const getCurrentAssignee = (complaint, data) => {
  if (!complaint.assignedTo) return null;
  
  const staff = data.staff.find(s => s.id === complaint.assignedTo);
  if (staff) return staff;
  
  const admin = data.admins.find(a => a.id === complaint.assignedTo);
  if (admin) return admin;
  
  return null;
};

export const getEscalationTarget = (complaint, data) => {
  const currentAssignee = getCurrentAssignee(complaint, data);
  
  if (!currentAssignee) {
    const availableStaff = data.staff.filter(s => 
      s.department === complaint.department && (s.level === 1 || !s.level)
    );
    return availableStaff.length > 0 ? availableStaff[0] : null;
  }
  
  const currentLevel = currentAssignee.level || 1;
  
  switch (currentLevel) {
    case 1:
      return findStaffByLevel(complaint.department, 2, data);
    case 2:
      return findStaffByLevel(complaint.department, 3, data);
    case 3:
      return data.admins.length > 0 ? data.admins[0] : null;
    case 4:
      return null;
    default:
      return null;
  }
};

export const findStaffByLevel = (department, level, data) => {
  return data.staff.find(s => 
    s.department === department && s.level === level
  ) || null;
};

export const canEscalate = (complaint, data) => {
  const escalationTarget = getEscalationTarget(complaint, data);
  return escalationTarget !== null;
};

export const getRoleName = (role) => {
  const roleNames = {
    'staff': 'موظف',
    'supervisor': 'مشرف', 
    'manager': 'مدير قسم',
    'admin': 'إدارة عليا',
    'patient': 'مريض'
  };
  return roleNames[role] || role;
};

export const getLevelByRole = (role) => {
  const levels = {
    'staff': 1,
    'supervisor': 2, 
    'manager': 3,
    'admin': 4
  };
  return levels[role] || 1;
};

export const autoAssignComplaintWithLevel = (complaint, staff, preferredLevel = 1) => {
  let availableStaff = staff.filter(s => 
    s.department === complaint.department && (s.level === preferredLevel || (!s.level && preferredLevel === 1))
  );
  
  if (availableStaff.length === 0) {
    availableStaff = staff.filter(s => s.department === complaint.department);
  }
  
  if (availableStaff.length > 0) {
    return availableStaff[Math.floor(Math.random() * availableStaff.length)];
  }
  
  return null;
};

export const getComplaintsNeedingEscalation = (complaints, data, escalationHours = 72) => {
  return complaints.filter(complaint => {
    if (checkEscalation(complaint, escalationHours)) {
      const currentAssignee = getCurrentAssignee(complaint, data);
      const escalationTarget = getEscalationTarget(complaint, data);
      
      return {
        ...complaint,
        currentAssignee,
        escalationTarget,
        hoursOverdue: Math.floor((new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60)) - escalationHours
      };
    }
    return false;
  }).filter(Boolean);
};

export const getEscalationStats = (complaints) => {
  const escalatedCount = complaints.filter(c => c.escalated).length;
  const needingEscalation = complaints.filter(c => checkEscalation(c)).length;
  const totalComplaints = complaints.length;
  
  return {
    escalatedCount,
    needingEscalation,
    totalComplaints,
    escalationRate: totalComplaints > 0 ? (escalatedCount / totalComplaints * 100).toFixed(1) : 0
  };
};