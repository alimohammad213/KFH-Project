import axios from 'axios';

// إعداد Base URL للـ API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// إنشاء axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// إدارة التوكن
class TokenManager {
  static getToken() {
    return localStorage.getItem('authToken');
  }

  static setToken(token) {
    localStorage.setItem('authToken', token);
  }

  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static setRefreshToken(token) {
    localStorage.setItem('refreshToken', token);
  }

  static removeTokens() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }

  static isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}

// Request interceptor لإضافة التوكن
api.interceptors.request.use((config) => {
  const token = TokenManager.getToken();
  if (token && !TokenManager.isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor لمعالجة انتهاء صلاحية التوكن
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          const { token } = response.data;
          TokenManager.setToken(token);
          
          // إعادة المحاولة مع التوكن الجديد
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // فشل تجديد التوكن
          TokenManager.removeTokens();
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      } else {
        // لا يوجد refresh token
        TokenManager.removeTokens();
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// خدمات المصادقة
export const authService = {
  // تسجيل الدخول
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, refreshToken, user } = response.data;
      
      TokenManager.setToken(token);
      TokenManager.setRefreshToken(refreshToken);
      
      return {
        success: true,
        data: { user, token, refreshToken }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في تسجيل الدخول'
      };
    }
  },

  // تسجيل مريض جديد
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في إنشاء الحساب'
      };
    }
  },

  // تسجيل الخروج
  async logout() {
    try {
      await api.post('/auth/logout');
      TokenManager.removeTokens();
      return { success: true };
    } catch (error) {
      // حتى لو فشل الطلب، نمسح التوكن محلياً
      TokenManager.removeTokens();
      return { success: true };
    }
  },

  // التحقق من صحة التوكن
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'انتهت صلاحية الجلسة'
      };
    }
  }
};

// خدمات الشكاوى
export const complaintsService = {
  // إنشاء شكوى جديدة
  async createComplaint(complaintData) {
    try {
      const response = await api.post('/complaints', complaintData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في إنشاء الشكوى'
      };
    }
  },

  // جلب جميع الشكاوى (مع الفلترة)
  async getComplaints(params = {}) {
    try {
      const response = await api.get('/complaints', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في جلب الشكاوى'
      };
    }
  },

  // جلب شكاوى المستخدم الحالي
  async getMyComplaints() {
    try {
      const response = await api.get('/complaints/my');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في جلب شكاواك'
      };
    }
  },

  // جلب تفاصيل شكوى واحدة
  async getComplaintDetails(complaintId) {
    try {
      const response = await api.get(`/complaints/${complaintId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في جلب تفاصيل الشكوى'
      };
    }
  },

  // تحديث حالة الشكوى
  async updateComplaintStatus(complaintId, statusData) {
    try {
      const response = await api.put(`/complaints/${complaintId}/status`, statusData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في تحديث حالة الشكوى'
      };
    }
  },

  // تعيين الشكوى لموظف
  async assignComplaint(complaintId, assignData) {
    try {
      const response = await api.put(`/complaints/${complaintId}/assign`, assignData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في تعيين الشكوى'
      };
    }
  },

  // حذف الشكوى
  async deleteComplaint(complaintId) {
    try {
      const response = await api.delete(`/complaints/${complaintId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في حذف الشكوى'
      };
    }
  },

  // إحصائيات الشكاوى
  async getComplaintsStats() {
    try {
      const response = await api.get('/complaints/stats/summary');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في جلب الإحصائيات'
      };
    }
  }
};

// خدمات الأقسام
export const departmentsService = {
  async getDepartments() {
    try {
      const response = await api.get('/departments');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في جلب الأقسام'
      };
    }
  },

  async createDepartment(deptData) {
    try {
      const response = await api.post('/departments', deptData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في إضافة القسم'
      };
    }
  },

  async updateDepartment(id, deptData) {
    try {
      const response = await api.put(`/departments/${id}`, deptData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في تحديث القسم'
      };
    }
  },

  async deleteDepartment(id) {
    try {
      const response = await api.delete(`/departments/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في حذف القسم'
      };
    }
  }
};

// خدمات الموظفين
export const usersService = {
  async getStaff() {
    try {
      const response = await api.get('/users');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في جلب الموظفين'
      };
    }
  },

  async createStaff(staffData) {
    try {
      const response = await api.post('/users', staffData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في إضافة الموظف'
      };
    }
  },

  async updateStaff(id, staffData) {
    try {
      const response = await api.put(`/users/${id}`, staffData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في تحديث الموظف'
      };
    }
  },

  async deleteStaff(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في حذف الموظف'
      };
    }
  },

  async toggleStaffStatus(id) {
    try {
      const response = await api.patch(`/users/${id}/toggle-status`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'حدث خطأ في تغيير حالة الموظف'
      };
    }
  }
};

// Helper functions
export const apiHelpers = {
  // معالجة الأخطاء العامة
  handleApiError(error) {
    if (error.response) {
      // الخادم أرجع خطأ
      return error.response.data?.message || 'حدث خطأ في الخادم';
    } else if (error.request) {
      // لا توجد استجابة من الخادم
      return 'لا يمكن الاتصال بالخادم';
    } else {
      // خطأ في إعداد الطلب
      return 'حدث خطأ غير متوقع';
    }
  },

  // فحص الاتصال بالإنترنت
  checkNetworkConnection() {
    return navigator.onLine;
  },

  // إنشاء معرف فريد
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};

export default api;