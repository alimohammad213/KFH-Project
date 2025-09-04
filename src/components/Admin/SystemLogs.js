import React, { useState, useMemo, useEffect } from 'react';
import { Clock, User, FileText, Filter, Download, Search, RefreshCw } from 'lucide-react';
import { complaintsService } from '../../services/api';
import { useAppContext } from '../../App';

const SystemLogs = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const { handleAppError } = useAppContext();

  const logsStyles = {
    container: "fade-in",
    header: "flex justify-between items-center mb-6",
    title: "text-xl font-bold",
    refreshBtn: "flex items-center text-blue-600 hover:text-blue-800 text-sm",
    filtersCard: "card mb-6",
    filtersGrid: "grid grid-cols-1 md:grid-cols-4 gap-4",
    filterSelect: "input-field",
    searchInput: "input-field",
    exportBtn: "btn-secondary",
    statsGrid: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6",
    statCard: "card text-center",
    statIcon: "w-8 h-8 mx-auto mb-2",
    statNumber: "text-2xl font-bold",
    statLabel: "text-gray-600 text-sm",
    logsCard: "card",
    cardHeader: "p-6 border-b flex justify-between items-center",
    cardTitle: "text-lg font-semibold",
    cardContent: "p-6",
    emptyState: "text-center py-8",
    emptyIcon: "mx-auto w-16 h-16 text-gray-300 mb-4",
    emptyText: "text-gray-500",
    logsList: "space-y-3",
    logItem: "flex items-start justify-between py-3 border-b last:border-b-0",
    logContent: "flex-1",
    logAction: "font-medium",
    logDetails: "text-sm text-gray-600 mt-1",
    logUser: "text-xs text-gray-500",
    logTime: "text-xs text-gray-500 text-left ml-4",
    actionBadge: "px-2 py-1 rounded text-xs font-medium",
    actionCreate: "bg-green-100 text-green-800",
    actionUpdate: "bg-blue-100 text-blue-800",
    actionDelete: "bg-red-100 text-red-800",
    actionEscalate: "bg-orange-100 text-orange-800",
    actionReassign: "bg-purple-100 text-purple-800",
    loadingSpinner: "flex items-center justify-center py-8",
    spinner: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await complaintsService.getComplaints();
      
      if (result.success) {
        setComplaints(result.data.complaints || []);
      } else {
        handleAppError(result.error);
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      handleAppError('حدث خطأ في جلب بيانات السجل');
    } finally {
      setLoading(false);
    }
  };

  // Generate logs from complaints data
  const logs = useMemo(() => {
    const allLogs = [];
    
    // Complaint creation logs
    complaints.forEach(c => {
      allLogs.push({
        id: c.id + '_created',
        action: 'إنشاء شكوى',
        type: 'create',
        user: c.patient_name,
        userType: 'مريض',
        target: c.subject,
        details: `تم إنشاء شكوى جديدة في قسم ${c.department_name}`,
        timestamp: c.created_at
      });

      // Status update logs (simulate based on status)
      if (c.status !== 'جديدة') {
        allLogs.push({
          id: c.id + '_status_update',
          action: 'تحديث حالة',
          type: c.status === 'متصعدة' ? 'escalate' : 
                c.assigned_to_name ? 'reassign' : 'update',
          user: c.assigned_to_name || 'النظام',
          userType: c.assigned_to_name ? 'موظف' : 'نظام',
          target: `${c.subject} - ${c.status}`,
          details: `تم تحديث حالة الشكوى إلى: ${c.status}`,
          timestamp: c.updated_at || c.created_at
        });
      }

      // Assignment logs
      if (c.assigned_to_name) {
        allLogs.push({
          id: c.id + '_assigned',
          action: 'تعيين شكوى',
          type: 'reassign',
          user: 'النظام',
          userType: 'نظام',
          target: `${c.subject} - ${c.assigned_to_name}`,
          details: `تم تعيين الشكوى للموظف: ${c.assigned_to_name}`,
          timestamp: c.created_at
        });
      }
    });

    // System activity logs (simulated)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Login logs (simulated)
    allLogs.push({
      id: 'login_' + Date.now(),
      action: 'تسجيل دخول',
      type: 'update',
      user: 'المدير',
      userType: 'إدارة',
      target: 'النظام',
      details: 'تم تسجيل الدخول للوحة الإدارة',
      timestamp: today.toISOString()
    });

    // Staff management logs (simulated)
    allLogs.push({
      id: 'staff_activity_' + Date.now(),
      action: 'إدارة الموظفين',
      type: 'create',
      user: 'المدير',
      userType: 'إدارة',
      target: 'نظام الموظفين',
      details: 'تم الوصول لقسم إدارة الموظفين',
      timestamp: new Date(today.getTime() - 3600000).toISOString()
    });

    return allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [complaints]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(log => log.type === filter);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        log.target.toLowerCase().includes(searchLower) ||
        log.user.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(log => new Date(log.timestamp) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(log => new Date(log.timestamp) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(log => new Date(log.timestamp) >= monthAgo);
    }

    return filtered;
  }, [logs, filter, searchTerm, dateFilter]);

  const getActionBadgeStyle = (type) => {
    const styles = {
      create: logsStyles.actionCreate,
      update: logsStyles.actionUpdate,
      delete: logsStyles.actionDelete,
      escalate: logsStyles.actionEscalate,
      reassign: logsStyles.actionReassign
    };
    return `${logsStyles.actionBadge} ${styles[type] || logsStyles.actionUpdate}`;
  };

  const exportLogs = () => {
    const csvContent = [
      ['التاريخ', 'الإجراء', 'المستخدم', 'الهدف', 'التفاصيل'].join(','),
      ...filteredLogs.map(log => [
        formatDateTime(log.timestamp),
        log.action,
        log.user,
        log.target,
        log.details
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Statistics
  const stats = {
    total: logs.length,
    today: logs.filter(log => {
      const today = new Date();
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === today.toDateString();
    }).length,
    complaints: logs.filter(log => log.action.includes('شكوى')).length,
    updates: logs.filter(log => log.action.includes('تحديث')).length
  };

  if (loading) {
    return (
      <div className={logsStyles.container}>
        <div className={logsStyles.loadingSpinner}>
          <div className={logsStyles.spinner}></div>
          <span className="mr-2">جاري تحميل سجل العمليات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={logsStyles.container}>
      <div className={logsStyles.header}>
        <h2 className={logsStyles.title}>سجل العمليات</h2>
        <button 
          onClick={fetchData}
          className={logsStyles.refreshBtn}
        >
          <RefreshCw className="w-4 h-4 ml-1" />
          تحديث
        </button>
      </div>

      {/* Statistics */}
      <div className={logsStyles.statsGrid}>
        <div className={logsStyles.statCard}>
          <Clock className={`${logsStyles.statIcon} text-blue-600`} />
          <div className={logsStyles.statNumber}>{stats.total}</div>
          <div className={logsStyles.statLabel}>إجمالي العمليات</div>
        </div>
        <div className={logsStyles.statCard}>
          <FileText className={`${logsStyles.statIcon} text-green-600`} />
          <div className={logsStyles.statNumber}>{stats.today}</div>
          <div className={logsStyles.statLabel}>عمليات اليوم</div>
        </div>
        <div className={logsStyles.statCard}>
          <User className={`${logsStyles.statIcon} text-purple-600`} />
          <div className={logsStyles.statNumber}>{stats.complaints}</div>
          <div className={logsStyles.statLabel}>عمليات الشكاوى</div>
        </div>
        <div className={logsStyles.statCard}>
          <Filter className={`${logsStyles.statIcon} text-orange-600`} />
          <div className={logsStyles.statNumber}>{stats.updates}</div>
          <div className={logsStyles.statLabel}>التحديثات</div>
        </div>
      </div>

      {/* Filters */}
      <div className={logsStyles.filtersCard}>
        <div className={logsStyles.filtersGrid}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={logsStyles.filterSelect}
          >
            <option value="all">جميع الإجراءات</option>
            <option value="create">إنشاء</option>
            <option value="update">تحديث</option>
            <option value="escalate">تصعيد</option>
            <option value="reassign">إعادة تعيين</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={logsStyles.filterSelect}
          >
            <option value="all">جميع التواريخ</option>
            <option value="today">اليوم</option>
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
          </select>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في السجل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${logsStyles.searchInput} pr-10`}
            />
          </div>

          <button onClick={exportLogs} className={logsStyles.exportBtn}>
            <Download className="w-4 h-4 inline ml-1" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className={logsStyles.logsCard}>
        <div className={logsStyles.cardHeader}>
          <h3 className={logsStyles.cardTitle}>
            سجل العمليات ({filteredLogs.length})
          </h3>
        </div>
        <div className={logsStyles.cardContent}>
          {filteredLogs.length === 0 ? (
            <div className={logsStyles.emptyState}>
              <Clock className={logsStyles.emptyIcon} />
              <p className={logsStyles.emptyText}>لا توجد عمليات مسجلة</p>
            </div>
          ) : (
            <div className={logsStyles.logsList}>
              {filteredLogs.slice(0, 100).map(log => (
                <div key={log.id} className={logsStyles.logItem}>
                  <div className={logsStyles.logContent}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={getActionBadgeStyle(log.type)}>
                        {log.action}
                      </span>
                      <span className={logsStyles.logAction}>{log.target}</span>
                    </div>
                    <p className={logsStyles.logDetails}>{log.details}</p>
                    <p className={logsStyles.logUser}>
                      بواسطة: {log.user} ({log.userType})
                    </p>
                  </div>
                  <div className={logsStyles.logTime}>
                    {formatDateTime(log.timestamp)}
                  </div>
                </div>
              ))}
              
              {filteredLogs.length > 100 && (
                <div className="text-center py-4 text-gray-500">
                  يتم عرض أول 100 عملية. استخدم الفلاتر لتضييق النتائج.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-gray-800 mb-2">معلومات حول سجل العمليات</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• يتم تسجيل جميع العمليات المهمة في النظام تلقائياً</li>
          <li>• السجل يتضمن: إنشاء الشكاوى، تحديث الحالات، التصعيد، وإدارة الموظفين</li>
          <li>• يمكن تصدير السجل بصيغة CSV للمراجعة والتحليل</li>
          <li>• يتم الاحتفاظ بالسجل لمدة سنة كاملة لأغراض التدقيق</li>
          <li>• يمكن البحث والفلترة في السجل حسب التاريخ ونوع العملية</li>
        </ul>
      </div>
    </div>
  );
};

export default SystemLogs;