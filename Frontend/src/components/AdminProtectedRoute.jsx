import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * (ยาม) สำหรับตรวจสอบว่า "เป็นแอดมินหรือไม่"
 */
function AdminProtectedRoute() {
  const location = useLocation();
  const { isAdmin, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // ล็อกอินแต่เป็น Patient → ไปหน้า Patient แทน
  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/patient/home" replace />;
  }

  // ยังไม่ล็อกอิน → ไปหน้า Login
  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default AdminProtectedRoute;