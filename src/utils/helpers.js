// دوال مساعدة
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

export const checkEscalation = (complaint, escalationHours = 72) => {
  const hoursSinceCreated = (new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60);
  return hoursSinceCreated > escalationHours && 
         complaint.status !== 'تم الحل' && 
         complaint.status !== 'مرفوضة' && 
         !complaint.escalated;
};