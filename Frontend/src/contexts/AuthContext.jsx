import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(sessionStorage.getItem('token'));

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').trim();

  const clearStoredSession = () => {
    localStorage.removeItem('users');
    localStorage.removeItem('selectedClinicId');
    localStorage.removeItem('selectedDoctorId');
    localStorage.removeItem('selectedDoctorData');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('users');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Configure axios defaults
  axios.defaults.baseURL = API_BASE_URL;

  const persistCurrentUser = (nextUser) => {
    if (nextUser) {
      sessionStorage.setItem('currentUser', JSON.stringify(nextUser));
      return;
    }

    sessionStorage.removeItem('currentUser');
  };

  // Set authorization header if token exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('currentUser');

      if (storedToken && storedUser) {
        try {
          // Verify token with backend
          const response = await axios.get('/api/auth/profile');
          const rawUser = response.data.user;
          const user = {
            ...rawUser,
            idCard: rawUser.id_card || rawUser.idCard || '',
            healthProfile: {
              dob: rawUser.date_of_birth || rawUser.dateOfBirth || '',
              age: rawUser.age || '',
              gender: rawUser.gender || '',
              height: rawUser.height || '',
              weight: rawUser.weight || '',
              conditions: rawUser.medical_conditions || '',
              allergies: rawUser.allergies || '',
            },
          };

          setUser(user);
          setToken(storedToken);
          persistCurrentUser(user);
        } catch (error) {
          // Token invalid, clear storage
          if (!error.response) {
            console.error('Profile check failed: backend unavailable or network error.');
          }
          clearStoredSession();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token } = response.data;

      setToken(token);
      sessionStorage.setItem('token', token);

      // Immediately set Authorization header so profile fetch works right away
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch complete profile after login
      const profileRes = await axios.get('/api/auth/profile');
      const rawUser = profileRes.data.user;
      const user = {
        ...rawUser,
        idCard: rawUser.id_card || rawUser.idCard || '',
        healthProfile: {
          dob: rawUser.date_of_birth || rawUser.dateOfBirth || '',
          age: rawUser.age || '',
          gender: rawUser.gender || '',
          height: rawUser.height || '',
          weight: rawUser.weight || '',
          conditions: rawUser.medical_conditions || '',
          allergies: rawUser.allergies || '',
        },
      };

      setUser(user);
      persistCurrentUser(user);

      return { success: true, user };
    } catch (error) {
      const fallbackMessage = !error.response
        ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาเปิด Backend ที่พอร์ต 5000 แล้วลองใหม่'
        : `${error.response.status} ${error.response.statusText} ${error.config?.url || ''}`;

      console.error('Login error details:', {
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      return {
        success: false,
        error: error.response?.data?.error || fallbackMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      const fallbackMessage = !error.response
        ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาเปิด Backend ที่พอร์ต 5000 แล้วลองใหม่'
        : 'Registration failed';

      return {
        success: false,
        error: error.response?.data?.error || fallbackMessage
      };
    }
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      persistCurrentUser(next);
      return next;
    });
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }

    setUser(null);
    setToken(null);
    clearStoredSession();
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/user/password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      const fallbackMessage = !error.response
        ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่'
        : 'Password update failed';
      return {
        success: false,
        error: error.response?.data?.error || fallbackMessage,
      };
    }
  };

  const deleteAccount = async () => {
    try {
      await axios.delete('/api/user/account');
      setUser(null);
      setToken(null);
      clearStoredSession();
      return { success: true };
    } catch (error) {
      const fallbackMessage = !error.response
        ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่'
        : 'Delete account failed';
      return {
        success: false,
        error: error.response?.data?.error || fallbackMessage,
      };
    }
  };

  const fetchAdminUserList = async () => {
    try {
      const response = await axios.get('/api/user/list');
      return {
        success: true,
        users: response.data?.users || response.data || [],
      };
    } catch (error) {
      const fallbackMessage = !error.response
        ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่'
        : 'ไม่สามารถดึงรายชื่อผู้ใช้ได้';
      return {
        success: false,
        error: error.response?.data?.error || fallbackMessage,
      };
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      const response = await axios.put(`/api/user/${userId}/role`, { role });
      return {
        success: true,
        user: response.data?.user || null,
      };
    } catch (error) {
      const fallbackMessage = !error.response
        ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่'
        : 'ไม่สามารถอัปเดตบทบาทผู้ใช้ได้';
      return {
        success: false,
        error: error.response?.data?.error || fallbackMessage,
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    deleteAccount,
    fetchAdminUserList,
    updateUserRole,
    isAuthenticated: !!user,
    isAdmin: (user?.role || '').toLowerCase() === 'admin',
    isPatient: (user?.role || '').toLowerCase() === 'patient'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};