import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar.jsx';

const getAdminHeaderProps = (pathname) => {
    if (pathname.includes('/admin/home')) return { title: 'แจ้งการนัดคนไข้', subtitle: 'จัดการคำขอและรอบนัดหมายของคนไข้ได้อย่างรวดเร็ว' };
    if (pathname.includes('/admin/history')) return { title: 'ประวัติการนัดหมาย', subtitle: 'ดูสรุปนัดหมายที่ยืนยันแล้วหรือถูกปฏิเสธ' };
    if (pathname.includes('/admin/clinics')) return { title: 'จัดการโรงพยาบาล/คลินิก/แพทย์', subtitle: 'เพิ่ม แก้ไข และดูรายละเอียดคลินิกและแพทย์ทั้งหมด' };
    if (pathname.includes('/admin/users')) return { title: 'จัดการผู้ใช้', subtitle: 'ดูแลบัญชีผู้ใช้และกำหนดสิทธิ์แอดมิน' };
    if (pathname.includes('/admin/appointments')) return { title: 'จัดการคนไข้', subtitle: 'ค้นหาและแก้ไขข้อมูลคนไข้ได้อย่างปลอดภัย' };
    if (pathname.includes('/admin/chat')) return { title: 'แชทกับคนไข้', subtitle: 'ติดต่อคนไข้ได้ทันที พร้อมประวัติการสนทนา' };
    if (pathname.includes('/admin/profile')) return { title: 'ตั้งค่า', subtitle: 'ปรับค่าบัญชีแอดมินและจัดการเซสชันของคุณ' };
    return { title: 'Admin Dashboard', subtitle: 'ศูนย์กลางการจัดการระบบของคุณ' };
};

function AdminLayout() {
    const location = useLocation();
    const headerProps = getAdminHeaderProps(location.pathname);

    return (
        <div className="admin-layout">
            <AdminSidebar />

            <main className="admin-main-content">
                {/* Page Header */}
                <div className="admin-page-header">
                    <div className="admin-page-header-inner">
                        <div>
                            <p className="admin-page-breadcrumb">Admin Dashboard</p>
                            <h1 className="admin-page-title">{headerProps.title}</h1>
                            <p className="admin-page-subtitle">{headerProps.subtitle}</p>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="admin-page-body">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;