import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar.jsx';

const getAdminHeaderProps = (pathname) => {
    if (pathname.includes('/admin/home')) return { title: 'แจ้งการนัดคนไข้' };
    if (pathname.includes('/admin/history')) return { title: 'ประวัติการนัดหมาย' };
    if (pathname.includes('/admin/clinics')) return { title: 'จัดการโรงพยาบาล/คลินิก/แพทย์' };
    if (pathname.includes('/admin/appointments')) return { title: 'จัดการคนไข้' };
    if (pathname.includes('/admin/chat')) return { title: 'แชทกับคนไข้' };
    if (pathname.includes('/admin/profile')) return { title: 'ตั้งค่า' };
    return { title: 'Admin Dashboard' };
};

function AdminLayout() {
    const location = useLocation();
    const headerProps = getAdminHeaderProps(location.pathname);

    return (
        <>
            <style>
                {`
                    .admin-layout {
                        display: flex;
                        min-height: 100vh;
                        background: #f8fafc;
                    }

                    .admin-main-content {
                        flex: 1;
                        margin-left: 280px;
                        min-height: 100vh;
                    }

                    .admin-page-header {
                        background: white;
                        padding: 20px 32px;
                        border-bottom: 1px solid #e5e7eb;
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }

                    .admin-page-title {
                        font-size: 24px;
                        font-weight: 700;
                        color: #1e293b;
                        margin: 0;
                    }

                    .admin-page-body {
                        padding: 24px 32px;
                    }

                    @media (max-width: 768px) {
                        .admin-main-content {
                            margin-left: 70px;
                        }
                        .admin-page-header {
                            padding: 16px 20px;
                        }
                        .admin-page-body {
                            padding: 16px 20px;
                        }
                    }
                `}
            </style>

            <div className="admin-layout">
                <AdminSidebar />
                
                <main className="admin-main-content">
                    {/* Page Header */}
                    <div className="admin-page-header">
                        <h1 className="admin-page-title">{headerProps.title}</h1>
                    </div>
                    
                    {/* Page Content */}
                    <div className="admin-page-body">
                        <Outlet />
                    </div>
                </main>
            </div>
        </>
    );
}

export default AdminLayout;