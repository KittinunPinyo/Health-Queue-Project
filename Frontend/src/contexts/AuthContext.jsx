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
  axios.defaults.baseURL = 'http://localhost:5000';

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
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          // Token invalid, clear storage
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
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(next));
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