import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * (ยาม) สำหรับตรวจสอบว่า "ล็อกอินหรือยัง" (สำหรับคนไข้)
 */
function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // ล็อกอินแต่เป็น Admin → ไปหน้า Admin แทน
  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin/home" replace />;
  }

  // ยังไม่ล็อกอิน → ไปหน้า Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;