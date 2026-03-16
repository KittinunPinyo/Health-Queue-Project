import React, { useEffect, useRef } from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * (ยาม) สำหรับตรวจสอบว่า "ล็อกอินหรือยัง" (สำหรับคนไข้)
 */
function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const alertShownRef = useRef(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !alertShownRef.current) {
      alert('กรุณาล็อกอินเพื่อเข้าสู่หน้านี้');
      alertShownRef.current = true;
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;