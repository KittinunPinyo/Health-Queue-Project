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
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();

  const clearStoredSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('users');
    localStorage.removeItem('selectedClinicId');
    localStorage.removeItem('selectedDoctorId');
    localStorage.removeItem('selectedDoctorData');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('users');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Configure axios defaults
  axios.defaults.baseURL = API_BASE_URL;

  const persistCurrentUser = (nextUser) => {
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
      sessionStorage.setItem('currentUser', JSON.stringify(nextUser));
      return;
    }

    localStorage.removeItem('user');
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
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Verify token with backend
          const response = await axios.get('/api/auth/profile');
          const rawUser = response.data.user;
          const user = {
            ...rawUser,
            idCard: rawUser.id_card || rawUser.idCard || '',
            healthProfile: {
              dob: rawUser.date_of_birth || '',
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
      localStorage.setItem('token', token);

      // Immediately set Authorization header so profile fetch works right away
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch complete profile after login
      const profileRes = await axios.get('/api/auth/profile');
      const rawUser = profileRes.data.user;
      const user = {
        ...rawUser,
        idCard: rawUser.id_card || rawUser.idCard || '',
        healthProfile: {
          dob: rawUser.date_of_birth || '',
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
        : 'Login failed';

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

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
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