import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

const DepartmentManagement = ({ data, setData }) => {
  const [newDepartment, setNewDepartment] = useState('');

  const deptStyles = {
    container: "fade-in",
    title: "text-xl font-bold mb-6",
    addCard: "card mb-6",
    addTitle: "text-lg font-semibold mb-4",
    addForm: "flex gap-4",
    input: "input-field flex-1",
    addBtn: "btn-success",
    listCard: "card",
    listTitle: "text-lg font-semibold mb-4",
    deptGrid: "grid grid-cols-1 md:grid-cols-3 gap-4",
    deptItem: "flex justify-between items-center p-3 border rounded-lg",
    deptName: "font-medium",
    deleteBtn: "text-red-600 hover:text-red-800"
  };

  const addDepartment = () => {
    const trimmedDept = newDepartment.trim();
    
    if (!trimmedDept) {
      alert('يرجى إدخال اسم القسم');
      return;
    }
    
    if (data.departments.includes(trimmedDept)) {
      alert('هذا القسم موجود مسبقاً');
      return;
    }
    
    setData(prev => ({
      ...prev,
      departments: [...prev.departments, trimmedDept]
    }));
    
    setNewDepartment('');
    alert('تم إضافة القسم بنجاح');
  };

  const deleteDepartment = (dept) => {
    // Check if department has staff or complaints
    const hasStaff = data.staff.some(s => s.department === dept);
    const hasComplaints = data.complaints.some(c => c.department === dept);
    
    if (hasStaff || hasComplaints) {
      alert('لا يمكن حذف هذا القسم لأنه يحتوي على موظفين أو شكاوى');
      return;
    }
    
    if (window.confirm(`هل أنت متأكد من حذف قسم "${dept}"؟`)) {
      setData(prev => ({
        ...prev,
        departments: prev.departments.filter(d => d !== dept)
      }));
      alert('تم حذف القسم بنجاح');
    }
  };

  return (
    <div className={deptStyles.container}>
      <h2 className={deptStyles.title}>إدارة الأقسام</h2>
      
      <div className={deptStyles.addCard}>
        <h3 className={deptStyles.addTitle}>إضافة قسم جديد</h3>
        <div className={deptStyles.addForm}>
          <input
            type="text"
            placeholder="اسم القسم"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            className={deptStyles.input}
            onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
          />
          <button
            onClick={addDepartment}
            className={deptStyles.addBtn}
          >
            إضافة
          </button>
        </div>
      </div>

      <div className={deptStyles.listCard}>
        <div className="p-6">
          <h3 className={deptStyles.listTitle}>الأقسام الحالية</h3>
          {data.departments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد أقسام</p>
          ) : (
            <div className={deptStyles.deptGrid}>
              {data.departments.map(dept => {
                const staffCount = data.staff.filter(s => s.department === dept).length;
                const complaintsCount = data.complaints.filter(c => c.department === dept).length;
                
                return (
                  <div key={dept} className={deptStyles.deptItem}>
                    <div>
                      <span className={deptStyles.deptName}>{dept}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        {staffCount} موظف • {complaintsCount} شكوى
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDepartment(dept)}
                      className={deptStyles.deleteBtn}
                      disabled={staffCount > 0 || complaintsCount > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentManagement;