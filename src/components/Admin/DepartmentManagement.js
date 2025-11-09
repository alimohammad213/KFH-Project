import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, RefreshCw, Settings } from 'lucide-react';
import { departmentsService } from '../../services/api';
import { useAppContext } from '../../App';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: ''
  });

  const { handleAppError } = useAppContext();

  const deptStyles = {
    container: "fade-in",
    header: "flex justify-between items-center mb-6",
    title: "text-xl font-bold",
    headerButtons: "flex gap-2",
    addBtn: "btn-success",
    refreshBtn: "flex items-center text-blue-600 hover:text-blue-800 text-sm",
    formCard: "card mb-6",
    formTitle: "text-lg font-semibold mb-4",
    formGrid: "space-y-4",
    input: "input-field",
    textarea: "input-field",
    buttonGroup: "flex gap-4",
    submitBtn: "btn-success",
    submitBtnDisabled: "btn-success opacity-50 cursor-not-allowed",
    cancelBtn: "btn-secondary",
    statsCard: "card mb-6",
    statsTitle: "text-lg font-semibold mb-4",
    statsGrid: "grid grid-cols-1 md:grid-cols-3 gap-4",
    statItem: "text-center p-4 bg-gray-50 rounded-lg",
    statNumber: "text-2xl font-bold text-blue-600",
    statLabel: "text-sm text-gray-600 mt-1",
    listCard: "card",
    listTitle: "text-lg font-semibold mb-4",
    deptGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
    deptItem: "border rounded-lg p-4 hover:shadow-md transition-shadow",
    deptHeader: "flex justify-between items-start mb-3",
    deptName: "font-semibold text-lg",
    deptActions: "flex gap-2",
    editBtn: "text-blue-600 hover:text-blue-800",
    deleteBtn: "text-red-600 hover:text-red-800",
    deptDescription: "text-gray-600 text-sm mb-3",
    deptStats: "grid grid-cols-2 gap-4 text-sm",
    deptStatItem: "text-center p-2 bg-gray-50 rounded",
    deptStatNumber: "font-bold text-blue-600",
    deptStatLabel: "text-gray-600",
    loadingSpinner: "flex items-center justify-center py-8",
    spinner: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600",
    emptyState: "text-center py-8 text-gray-500",
    errorAlert: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const result = await departmentsService.getDepartments();
      
      if (result.success) {
        setDepartments(result.data.departments || []);
      } else {
        handleAppError(result.error);
      }
    } catch (error) {
      console.error('خطأ في جلب الأقسام:', error);
      handleAppError('حدث خطأ في جلب الأقسام');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewDepartment({ name: '', description: '' });
    setEditingDept(null);
    setShowAddForm(false);
  };

  const validateForm = () => {
    if (!newDepartment.name.trim()) {
      alert('يرجى إدخال اسم القسم');
      return false;
    }
    return true;
  };

  const addDepartment = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const result = await departmentsService.createDepartment({
        name: newDepartment.name.trim(),
        description: newDepartment.description.trim() || null
      });
      
      if (result.success) {
        alert(result.data.message_ar || 'تم إضافة القسم بنجاح');
        resetForm();
        await fetchDepartments();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('خطأ في إضافة القسم:', error);
      handleAppError('حدث خطأ في إضافة القسم');
    } finally {
      setSubmitting(false);
    }
  };

  const editDepartment = (dept) => {
    setEditingDept(dept);
    setNewDepartment({
      name: dept.name,
      description: dept.description || ''
    });
    setShowAddForm(true);
  };

  const updateDepartment = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const result = await departmentsService.updateDepartment(editingDept.id, {
        name: newDepartment.name.trim(),
        description: newDepartment.description.trim() || null
      });
      
      if (result.success) {
        alert(result.data.message_ar || 'تم تحديث القسم بنجاح');
        resetForm();
        await fetchDepartments();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('خطأ في تحديث القسم:', error);
      handleAppError('حدث خطأ في تحديث القسم');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDepartment = async (deptId, deptName) => {
    if (window.confirm(`هل أنت متأكد من حذف قسم "${deptName}"؟`)) {
      try {
        setSubmitting(true);
        const result = await departmentsService.deleteDepartment(deptId);
        
        if (result.success) {
          alert(result.data.message_ar || 'تم حذف القسم بنجاح');
          await fetchDepartments();
        } else {
          alert(result.error);
        }
      } catch (error) {
        console.error('خطأ في حذف القسم:', error);
        handleAppError('حدث خطأ في حذف القسم');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // حساب الإحصائيات
  const getStats = () => {
    const totalDepts = departments.length;
    const totalComplaints = departments.reduce((sum, dept) => sum + (dept.complaints_count || 0), 0);
    const avgComplaintsPerDept = totalDepts > 0 ? Math.round(totalComplaints / totalDepts) : 0;

    return {
      totalDepts,
      totalComplaints,
      avgComplaintsPerDept
    };
  };

  if (loading) {
    return (
      <div className={deptStyles.container}>
        <div className={deptStyles.loadingSpinner}>
          <div className={deptStyles.spinner}></div>
          <span className="mr-2">جاري تحميل بيانات الأقسام...</span>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className={deptStyles.container}>
      <div className={deptStyles.header}>
        <h2 className={deptStyles.title}>إدارة الأقسام</h2>
        <div className={deptStyles.headerButtons}>
          <button
            onClick={fetchDepartments}
            disabled={submitting}
            className={deptStyles.refreshBtn}
          >
            <RefreshCw className="w-4 h-4 ml-1" />
            تحديث
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={submitting}
            className={deptStyles.addBtn}
          >
            <Plus className="w-4 h-4 inline ml-1" />
            إضافة قسم
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className={deptStyles.statsCard}>
        <h3 className={deptStyles.statsTitle}>
          <Settings className="w-5 h-5 inline ml-2" />
          إحصائيات عامة
        </h3>
        <div className={deptStyles.statsGrid}>
          <div className={deptStyles.statItem}>
            <div className={deptStyles.statNumber}>{stats.totalDepts}</div>
            <div className={deptStyles.statLabel}>إجمالي الأقسام</div>
          </div>
          <div className={deptStyles.statItem}>
            <div className={deptStyles.statNumber}>{stats.totalComplaints}</div>
            <div className={deptStyles.statLabel}>إجمالي الشكاوى</div>
          </div>
          <div className={deptStyles.statItem}>
            <div className={deptStyles.statNumber}>{stats.avgComplaintsPerDept}</div>
            <div className={deptStyles.statLabel}>متوسط الشكاوى لكل قسم</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className={deptStyles.formCard}>
          <h3 className={deptStyles.formTitle}>
            {editingDept ? 'تعديل القسم' : 'إضافة قسم جديد'}
          </h3>
          <div className={deptStyles.formGrid}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم القسم *
              </label>
              <input
                type="text"
                placeholder="مثل: قسم الجراحة"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                className={deptStyles.input}
                disabled={submitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف القسم
              </label>
              <textarea
                placeholder="وصف مختصر عن القسم وخدماته"
                value={newDepartment.description}
                onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                className={deptStyles.textarea}
                rows="3"
                disabled={submitting}
              />
            </div>
          </div>
          
          <div className={deptStyles.buttonGroup}>
            <button 
              onClick={editingDept ? updateDepartment : addDepartment} 
              disabled={submitting}
              className={submitting ? deptStyles.submitBtnDisabled : deptStyles.submitBtn}
            >
              {submitting 
                ? (editingDept ? 'جاري التحديث...' : 'جاري الإضافة...') 
                : (editingDept ? 'تحديث القسم' : 'إضافة القسم')
              }
            </button>
            <button
              onClick={resetForm}
              disabled={submitting}
              className={deptStyles.cancelBtn}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Departments List */}
      <div className={deptStyles.listCard}>
        <div className="p-6">
          <h3 className={deptStyles.listTitle}>الأقسام الحالية ({departments.length})</h3>
          {departments.length === 0 ? (
            <div className={deptStyles.emptyState}>
              <p>لا توجد أقسام مسجلة</p>
            </div>
          ) : (
            <div className={deptStyles.deptGrid}>
              {departments.map(dept => (
                <div key={dept.id} className={deptStyles.deptItem}>
                  <div className={deptStyles.deptHeader}>
                    <h4 className={deptStyles.deptName}>{dept.name}</h4>
                    <div className={deptStyles.deptActions}>
                      <button
                        onClick={() => editDepartment(dept)}
                        className={deptStyles.editBtn}
                        disabled={submitting}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDepartment(dept.id, dept.name)}
                        className={deptStyles.deleteBtn}
                        disabled={submitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {dept.description && (
                    <p className={deptStyles.deptDescription}>
                      {dept.description}
                    </p>
                  )}
                  
                  <div className={deptStyles.deptStats}>
                    <div className={deptStyles.deptStatItem}>
                      <div className={deptStyles.deptStatNumber}>{dept.complaints_count || 0}</div>
                      <div className={deptStyles.deptStatLabel}>إجمالي الشكاوى</div>
                    </div>
                    <div className={deptStyles.deptStatItem}>
                      <div className={deptStyles.deptStatNumber}>{dept.resolved_count || 0}</div>
                      <div className={deptStyles.deptStatLabel}>تم الحل</div>
                    </div>
                    <div className={deptStyles.deptStatItem}>
                      <div className={deptStyles.deptStatNumber}>
                        {(dept.complaints_count || 0) - (dept.resolved_count || 0)}
                      </div>
                      <div className={deptStyles.deptStatLabel}>قيد المعالجة</div>
                    </div>
                    <div className={deptStyles.deptStatItem}>
                      <div className={deptStyles.deptStatNumber}>
                        {dept.complaints_count > 0 
                          ? Math.round((dept.resolved_count / dept.complaints_count) * 100)
                          : 0
                        }%
                      </div>
                      <div className={deptStyles.deptStatLabel}>معدل الحل</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* معلومات إضافية */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-blue-800 mb-2">معلومات حول إدارة الأقسام</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• يمكن إضافة أقسام جديدة حسب احتياجات المستشفى</li>
          <li>• لا يمكن حذف قسم يحتوي على شكاوى أو موظفين</li>
          <li>• يتم حساب الإحصائيات تلقائياً من قاعدة البيانات</li>
          <li>• يمكن تعديل اسم ووصف القسم في أي وقت</li>
          <li>• جميع التغييرات يتم حفظها في قاعدة البيانات مباشرة</li>
        </ul>
      </div>
    </div>
  );
};

export default DepartmentManagement;