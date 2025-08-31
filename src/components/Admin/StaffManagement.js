import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getLevelByRole, getRoleName } from '../../utils/helpers';
import { useAppContext } from '../../App'; // استيراد الـ Context

const StaffManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '', username: '', password: '', department: '', role: 'staff'
  });

  // استخدام البيانات من الـ Context
  const { data, setData } = useAppContext();

  const staffStyles = {
    container: "fade-in",
    header: "flex justify-between items-center mb-6",
    title: "text-xl font-bold",
    addBtn: "btn-success",
    formCard: "card mb-6",
    formTitle: "text-lg font-semibold mb-4",
    formGrid: "grid grid-cols-1 md:grid-cols-2 gap-4",
    input: "input-field",
    buttonGroup: "flex gap-4 mt-4",
    submitBtn: "btn-success",
    cancelBtn: "btn-secondary",
    tableCard: "card",
    table: "w-full",
    tableHead: "border-b",
    tableHeader: "text-right py-3",
    tableRow: "border-b",
    tableCell: "py-3",
    deleteBtn: "text-red-600 hover:text-red-800"
  };

  const addStaff = () => {
    if (!newStaff.name || !newStaff.username || !newStaff.password || !newStaff.department || !newStaff.role) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    if (data.staff.find(s => s.username === newStaff.username)) {
      alert('اسم المستخدم موجود مسبقاً');
      return;
    }

    const staffMember = {
      id: Date.now().toString(),
      name: newStaff.name,
      username: newStaff.username,
      password: newStaff.password,
      department: newStaff.department,
      role: newStaff.role,
      level: getLevelByRole(newStaff.role)
    };
    
    setData(prev => ({
      ...prev,
      staff: [...prev.staff, staffMember]
    }));
    
    setNewStaff({ name: '', username: '', password: '', department: '', role: 'staff' });
    setShowAddForm(false);
    alert('تم إضافة الموظف بنجاح');
  };

  const deleteStaff = (staffId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      setData(prev => ({
        ...prev,
        staff: prev.staff.filter(s => s.id !== staffId)
      }));
      alert('تم حذف الموظف بنجاح');
    }
  };

  return (
    <div className={staffStyles.container}>
      <div className={staffStyles.header}>
        <h2 className={staffStyles.title}>إدارة الموظفين</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className={staffStyles.addBtn}
        >
          <Plus className="w-4 h-4 inline ml-1" />
          إضافة موظف
        </button>
      </div>

      {showAddForm && (
        <div className={staffStyles.formCard}>
          <h3 className={staffStyles.formTitle}>إضافة موظف جديد</h3>
          <div className={staffStyles.formGrid}>
            <input
              type="text"
              placeholder="اسم الموظف"
              value={newStaff.name}
              onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
              className={staffStyles.input}
            />
            <input
              type="text"
              placeholder="اسم المستخدم"
              value={newStaff.username}
              onChange={(e) => setNewStaff({...newStaff, username: e.target.value})}
              className={staffStyles.input}
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={newStaff.password}
              onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
              className={staffStyles.input}
            />
            <select
              value={newStaff.department}
              onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
              className={staffStyles.input}
            >
              <option value="">اختر القسم</option>
              {data.departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={newStaff.role}
              onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
              className={staffStyles.input}
            >
              <option value="staff">موظف عادي (مستوى 1)</option>
              <option value="supervisor">مشرف (مستوى 2)</option>
              <option value="manager">مدير قسم (مستوى 3)</option>
            </select>
          </div>
          <div className={staffStyles.buttonGroup}>
            <button onClick={addStaff} className={staffStyles.submitBtn}>
              إضافة
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className={staffStyles.cancelBtn}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className={staffStyles.tableCard}>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className={staffStyles.table}>
              <thead>
                <tr className={staffStyles.tableHead}>
                  <th className={staffStyles.tableHeader}>الاسم</th>
                  <th className={staffStyles.tableHeader}>اسم المستخدم</th>
                  <th className={staffStyles.tableHeader}>القسم</th>
                  <th className={staffStyles.tableHeader}>المستوى</th>
                  <th className={staffStyles.tableHeader}>الشكاوى المعينة</th>
                  <th className={staffStyles.tableHeader}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.staff.map(staff => (
                  <tr key={staff.id} className={staffStyles.tableRow}>
                    <td className={staffStyles.tableCell}>{staff.name}</td>
                    <td className={staffStyles.tableCell}>{staff.username}</td>
                    <td className={staffStyles.tableCell}>{staff.department}</td>
                    <td className={staffStyles.tableCell}>
                      {getRoleName(staff.role)} ({staff.level || 1})
                    </td>
                    <td className={staffStyles.tableCell}>
                      {data.complaints.filter(c => c.assignedTo === staff.id).length}
                    </td>
                    <td className={staffStyles.tableCell}>
                      <button
                        onClick={() => deleteStaff(staff.id)}
                        className={staffStyles.deleteBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.staff.length === 0 && (
            <p className="text-gray-500 text-center py-8">لا يوجد موظفين</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;