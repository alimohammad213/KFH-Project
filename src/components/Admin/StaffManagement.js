import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, RefreshCw, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react';
import { usersService, departmentsService } from '../../services/api';
import { useAppContext } from '../../App';

const StaffManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '', 
    username: '', 
    password: '', 
    department_id: '', 
    role: 'staff'
  });

  const { handleAppError } = useAppContext();

  const staffStyles = {
    container: "fade-in",
    header: "flex justify-between items-center mb-6",
    title: "text-xl font-bold",
    addBtn: "btn-success",
    refreshBtn: "flex items-center text-blue-600 hover:text-blue-800 text-sm ml-4",
    formCard: "card mb-6",
    formTitle: "text-lg font-semibold mb-4",
    formGrid: "grid grid-cols-1 md:grid-cols-2 gap-4",
    input: "input-field",
    buttonGroup: "flex gap-4 mt-4",
    submitBtn: "btn-success",
    submitBtnDisabled: "btn-success opacity-50 cursor-not-allowed",
    cancelBtn: "btn-secondary",
    tableCard: "card",
    table: "w-full",
    tableHead: "border-b bg-gray-50",
    tableHeader: "text-right py-3 px-4 font-semibold",
    tableRow: "border-b hover:bg-gray-50",
    tableCell: "py-3 px-4",
    actionButtons: "flex gap-2",
    editBtn: "text-blue-600 hover:text-blue-800",
    deleteBtn: "text-red-600 hover:text-red-800",
    statusBtn: "text-gray-600 hover:text-gray-800",
    badge: "px-2 py-1 rounded-full text-xs font-medium",
    roleBadge: {
      staff: "bg-blue-100 text-blue-800",
      supervisor: "bg-yellow-100 text-yellow-800", 
      manager: "bg-purple-100 text-purple-800"
    },
    loadingSpinner: "flex items-center justify-center py-8",
    spinner: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600",
    emptyState: "text-center py-8 text-gray-500",
    passwordToggle: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // جلب الموظفين والأقسام
      const [staffResult, deptsResult] = await Promise.all([
        usersService.getStaff(),
        departmentsService.getDepartments()
      ]);

      if (staffResult.success) {
        setStaffList(staffResult.data.staff || []);
      } else {
        handleAppError(staffResult.error);
      }

      if (deptsResult.success) {
        setDepartments(deptsResult.data.departments || []);
      }

    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      handleAppError('حدث خطأ في جلب بيانات الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role) => {
    const names = {
      'staff': 'موظف',
      'supervisor': 'مشرف',
      'manager': 'مدير قسم'
    };
    return names[role] || role;
  };

  const getDepartmentName = (id) => {
    const dept = departments.find(d => d.id === parseInt(id));
    return dept ? dept.name : '';
  };

  const resetForm = () => {
    setNewStaff({ name: '', username: '', password: '', department_id: '', role: 'staff' });
    setEditingStaff(null);
    setShowAddForm(false);
    setShowPassword(false);
  };

  const validateForm = () => {
    if (!newStaff.name.trim()) {
      alert('يرجى إدخال اسم الموظف');
      return false;
    }
    if (!newStaff.username.trim()) {
      alert('يرجى إدخال اسم المستخدم');
      return false;
    }
    if (!editingStaff && !newStaff.password) {
      alert('يرجى إدخال كلمة المرور');
      return false;
    }
    if (!newStaff.department_id) {
      alert('يرجى اختيار القسم');
      return false;
    }
    return true;
  };

  const addStaff = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const result = await usersService.createStaff({
        name: newStaff.name.trim(),
        username: newStaff.username.trim(),
        password: newStaff.password,
        department_id: parseInt(newStaff.department_id),
        role: newStaff.role
      });
      
      if (result.success) {
        alert(result.data.message_ar || 'تم إضافة الموظف بنجاح');
        resetForm();
        await fetchData();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('خطأ في إضافة الموظف:', error);
      handleAppError('حدث خطأ في إضافة الموظف');
    } finally {
      setSubmitting(false);
    }
  };

  const editStaff = (staff) => {
    setEditingStaff(staff);
    setNewStaff({
      name: staff.name,
      username: staff.username,
      password: '',
      department_id: staff.department_id.toString(),
      role: staff.role
    });
    setShowAddForm(true);
  };

  const updateStaff = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const updateData = {
        name: newStaff.name.trim(),
        username: newStaff.username.trim(),
        department_id: parseInt(newStaff.department_id),
        role: newStaff.role
      };

      // إضافة كلمة المرور فقط إذا تم إدخال واحدة جديدة
      if (newStaff.password.trim()) {
        updateData.password = newStaff.password;
      }

      const result = await usersService.updateStaff(editingStaff.id, updateData);
      
      if (result.success) {
        alert(result.data.message_ar || 'تم تحديث بيانات الموظف بنجاح');
        resetForm();
        await fetchData();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('خطأ في تحديث الموظف:', error);
      handleAppError('حدث خطأ في تحديث الموظف');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteStaff = async (staffId, staffName) => {
    if (window.confirm(`هل أنت متأكد من حذف الموظف "${staffName}"؟`)) {
      try {
        setSubmitting(true);
        const result = await usersService.deleteStaff(staffId);
        
        if (result.success) {
          alert(result.data.message_ar || 'تم حذف الموظف بنجاح');
          await fetchData();
        } else {
          alert(result.error);
        }
      } catch (error) {
        console.error('خطأ في حذف الموظف:', error);
        handleAppError('حدث خطأ في حذف الموظف');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const toggleStaffStatus = async (staffId, currentStatus) => {
    try {
      setSubmitting(true);
      const result = await usersService.toggleStaffStatus(staffId);
      
      if (result.success) {
        alert(result.data.message_ar || 'تم تغيير حالة الموظف بنجاح');
        await fetchData();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('خطأ في تغيير حالة الموظف:', error);
      handleAppError('حدث خطأ في تغيير حالة الموظف');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={staffStyles.container}>
        <div className={staffStyles.loadingSpinner}>
          <div className={staffStyles.spinner}></div>
          <span className="mr-2">جاري تحميل بيانات الموظفين...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={staffStyles.container}>
      <div className={staffStyles.header}>
        <h2 className={staffStyles.title}>إدارة الموظفين</h2>
        <div className="flex items-center">
          <button
            onClick={fetchData}
            disabled={submitting}
            className={staffStyles.refreshBtn}
          >
            <RefreshCw className="w-4 h-4 ml-1" />
            تحديث
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={submitting}
            className={staffStyles.addBtn}
          >
            <Plus className="w-4 h-4 inline ml-1" />
            إضافة موظف
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className={staffStyles.formCard}>
          <h3 className={staffStyles.formTitle}>
            {editingStaff ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
          </h3>
          <div className={staffStyles.formGrid}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الموظف *
              </label>
              <input
                type="text"
                placeholder="الاسم الكامل"
                value={newStaff.name}
                onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                className={staffStyles.input}
                disabled={submitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم *
              </label>
              <input
                type="text"
                placeholder="username"
                value={newStaff.username}
                onChange={(e) => setNewStaff({...newStaff, username: e.target.value})}
                className={staffStyles.input}
                disabled={submitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور {editingStaff ? '(اتركها فارغة لعدم التغيير)' : '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={editingStaff ? "كلمة مرور جديدة" : "كلمة المرور"}
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                  className={`${staffStyles.input} pl-10`}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={staffStyles.passwordToggle}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                القسم *
              </label>
              <select
                value={newStaff.department_id}
                onChange={(e) => setNewStaff({...newStaff, department_id: e.target.value})}
                className={staffStyles.input}
                disabled={submitting}
              >
                <option value="">اختر القسم</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المنصب *
              </label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                className={staffStyles.input}
                disabled={submitting}
              >
                <option value="staff">موظف عادي (مستوى 1)</option>
                <option value="supervisor">مشرف (مستوى 2)</option>
                <option value="manager">مدير قسم (مستوى 3)</option>
              </select>
            </div>
          </div>
          
          <div className={staffStyles.buttonGroup}>
            <button 
              onClick={editingStaff ? updateStaff : addStaff} 
              disabled={submitting}
              className={submitting ? staffStyles.submitBtnDisabled : staffStyles.submitBtn}
            >
              {submitting 
                ? (editingStaff ? 'جاري التحديث...' : 'جاري الإضافة...') 
                : (editingStaff ? 'تحديث البيانات' : 'إضافة الموظف')
              }
            </button>
            <button
              onClick={resetForm}
              disabled={submitting}
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
              <thead className={staffStyles.tableHead}>
                <tr>
                  <th className={staffStyles.tableHeader}>الاسم</th>
                  <th className={staffStyles.tableHeader}>اسم المستخدم</th>
                  <th className={staffStyles.tableHeader}>القسم</th>
                  <th className={staffStyles.tableHeader}>المنصب</th>
                  <th className={staffStyles.tableHeader}>الشكاوى المعينة</th>
                  <th className={staffStyles.tableHeader}>الحالة</th>
                  <th className={staffStyles.tableHeader}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => (
                  <tr key={staff.id} className={staffStyles.tableRow}>
                    <td className={staffStyles.tableCell}>
                      <div>
                        <div className="font-medium">{staff.name}</div>
                        <div className="text-sm text-gray-500">مستوى {staff.level}</div>
                      </div>
                    </td>
                    <td className={staffStyles.tableCell}>{staff.username}</td>
                    <td className={staffStyles.tableCell}>{staff.department_name}</td>
                    <td className={staffStyles.tableCell}>
                      <span className={`${staffStyles.badge} ${staffStyles.roleBadge[staff.role]}`}>
                        {getRoleName(staff.role)}
                      </span>
                    </td>
                    <td className={staffStyles.tableCell}>
                      <span className="font-semibold">{staff.assigned_complaints}</span>
                      <span className="text-sm text-gray-500"> شكوى</span>
                    </td>
                    <td className={staffStyles.tableCell}>
                      <span className={`${staffStyles.badge} ${staff.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {staff.verified ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className={staffStyles.tableCell}>
                      <div className={staffStyles.actionButtons}>
                        <button
                          onClick={() => editStaff(staff)}
                          className={staffStyles.editBtn}
                          disabled={submitting}
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStaffStatus(staff.id, staff.verified)}
                          className={staffStyles.statusBtn}
                          disabled={submitting}
                          title={staff.verified ? 'تعطيل' : 'تفعيل'}
                        >
                          {staff.verified ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteStaff(staff.id, staff.name)}
                          className={staffStyles.deleteBtn}
                          disabled={submitting || staff.assigned_complaints > 0}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {staffList.length === 0 && (
            <div className={staffStyles.emptyState}>
              <p>لا يوجد موظفين مسجلين</p>
            </div>
          )}
        </div>
      </div>
      
      {/* معلومات إضافية */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-blue-800 mb-2">معلومات حول إدارة الموظفين</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• يمكن إضافة موظفين جدد في أي قسم من أقسام المستشفى</li>
          <li>• كل موظف له مستوى صلاحية حسب منصبه (موظف: 1، مشرف: 2، مدير: 3)</li>
          <li>• لا يمكن حذف موظف لديه شكاوى معينة إليه</li>
          <li>• يمكن تعديل بيانات الموظف وتفعيل/تعطيل الحساب</li>
          <li>• جميع التغييرات يتم حفظها في قاعدة البيانات مباشرة</li>
        </ul>
      </div>
    </div>
  );
};

export default StaffManagement;