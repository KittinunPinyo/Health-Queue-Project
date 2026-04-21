import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminProtectedRoute from './components/AdminProtectedRoute.jsx';
import PatientLayout from './PatientLayout.jsx';
import AdminLayout from './AdminLayout.jsx';
import Login from './Login/Login.jsx';
import Home from './pages_patient/Home.jsx';
import SearchResults from './pages_patient/SearchResults.jsx';
import ClinicDetail from './pages_patient/ClinicDetail.jsx';
import MyAppointments from './pages_patient/MyAppointments.jsx';
import Profile from './pages_patient/Profile.jsx';
import Notifications from './pages_patient/Notifications.jsx';
import Chat from './chat/chat.jsx'; 
import HomeAdmin from './pages_admin/HomeAdmin.jsx';
import Clinics from './pages_admin/Clinics.jsx';
import Appointments from './pages_admin/Appointments.jsx';
import AdminChat from './chat/adminchat.jsx';
import AppointmentHistory from './pages_admin/AppointmentHistory.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate replace to="/patient/home" />} />
      
      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<Navigate replace to="home" />} /> 
        <Route path="home" element={<Home />} /> 
        <Route path="search" element={<SearchResults />} />
        <Route path="clinic-detail" element={<ClinicDetail />} /> 
        <Route path="clinic-detail/:id" element={<ClinicDetail />} />
        <Route path="chat" element={<Chat />} />
        <Route element={<ProtectedRoute />}>
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      
      <Route path="/admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate replace to="home" />} />
          <Route path="home" element={<HomeAdmin />} />
          <Route path="history" element={<AppointmentHistory />} />
          <Route path="clinics" element={<Clinics />} />
          <Route path="appointments" element={<Appointments />} /> 
          <Route path="chat" element={<AdminChat />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate replace to="/patient/home" />} />
    </Routes>
  );
}