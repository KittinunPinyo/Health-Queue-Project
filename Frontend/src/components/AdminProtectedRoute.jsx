import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * (ยาม) สำหรับตรวจสอบว่า "เป็นแอดมินหรือไม่"
 */
function AdminProtectedRoute() {
  const location = useLocation();
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default AdminProtectedRoute;