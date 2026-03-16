import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Icons
const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
    </svg>
);

const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const UserIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

function AppointmentHistory() {
    const { t } = useLanguage();
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = () => {
        // ดึงข้อมูลจากทั้ง requests และ appointments
        const storedRequests = JSON.parse(localStorage.getItem('requests')) || [];
        const storedAppointments = JSON.parse(localStorage.getItem('appointments')) || [];
        
        // แปลง requests ให้เป็นรูปแบบเดียวกับ appointments
        const formattedRequests = storedRequests.map(req => ({
            id: req.id,
            patientName: req.patient?.name || req.patientName || 'ไม่ระบุ',
            patientPhone: req.patient?.phone || req.patientPhone || '-',
            clinicName: req.clinic?.name || req.clinicName || '-',
            doctorName: req.selectedDoctor || req.doctorName || '-',
            specialty: req.selectedSpecialty || req.specialty || '-',
            date: req.date,
            time: req.time,
            status: req.status === 'new' ? 'pending' : (req.status || 'pending'),
            createdAt: req.createdAt || new Date(req.id).toISOString(),
            source: 'requests'
        }));

        // รวมข้อมูลทั้งหมด
        const allAppointments = [...formattedRequests, ...storedAppointments];
        
        // เรียงตามวันที่ล่าสุดก่อน
        const sorted = allAppointments.sort((a, b) => 
            new Date(b.createdAt || b.date || b.id) - new Date(a.createdAt || a.date || a.id)
        );
        setAppointments(sorted);
    };

    const filteredAppointments = useMemo(() => {
        let result = appointments;

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(apt => 
                apt.patientName?.toLowerCase().includes(term) ||
                apt.doctorName?.toLowerCase().includes(term) ||
                apt.clinicName?.toLowerCase().includes(term) ||
                apt.specialty?.toLowerCase().includes(term) ||
                apt.id?.toString().includes(term) // ค้นหาด้วยรหัสนัดหมาย
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            if (statusFilter === 'pending') {
                result = result.filter(apt => apt.status === 'pending' || apt.status === 'new');
            } else if (statusFilter === 'cancelled') {
                result = result.filter(apt => apt.status === 'cancelled' || apt.status === 'rejected');
            } else {
                result = result.filter(apt => apt.status === statusFilter);
            }
        }

        // Filter by date
        if (dateFilter) {
            result = result.filter(apt => apt.date === dateFilter);
        }

        return result;
    }, [appointments, searchTerm, statusFilter, dateFilter]);

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e', text: 'รอยืนยัน', icon: '⏳' },
            new: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e', text: 'รอยืนยัน', icon: '⏳' },
            confirmed: { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#065f46', text: 'ยืนยันแล้ว', icon: '✓' },
            completed: { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', text: 'เสร็จสิ้น', icon: '✔' },
            cancelled: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#991b1b', text: 'ยกเลิก', icon: '✕' },
            rejected: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#991b1b', text: 'ปฏิเสธ', icon: '✕' },
        };
        const style = styles[status] || styles.pending;
        return (
            <span style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                background: style.bg,
                color: style.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}>
                <span style={{ fontSize: '11px' }}>{style.icon}</span>
                {style.text}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Statistics
    const stats = useMemo(() => {
        return {
            total: appointments.length,
            pending: appointments.filter(a => a.status === 'pending' || a.status === 'new').length,
            confirmed: appointments.filter(a => a.status === 'confirmed').length,
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled' || a.status === 'rejected').length,
        };
    }, [appointments]);

    return (
        <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            padding: '0 1rem'
        }}>
            {/* Page Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1.5rem 2rem',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
            }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div>
                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>ประวัติการนัดหมาย</h2>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                        ติดตามและจัดการนัดหมายทั้งหมดในระบบ
                    </p>
                </div>
            </div>

            {/* Stats Cards - Modern Design */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total */}
                <div 
                    onClick={() => setStatusFilter('all')}
                    style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                        padding: '24px', 
                        borderRadius: '20px', 
                        boxShadow: statusFilter === 'all' ? '0 0 0 4px rgba(102, 126, 234, 0.5), 0 8px 25px rgba(102, 126, 234, 0.35)' : '0 8px 25px rgba(102, 126, 234, 0.35)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'pointer'
                    }}
                    className="stat-card"
                >
                    <div style={{ 
                        position: 'absolute', 
                        right: '-20px', 
                        top: '-20px', 
                        width: '100px', 
                        height: '100px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '50%' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        right: '20px', 
                        bottom: '15px', 
                        opacity: 0.3
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="white" strokeWidth="1.5" fill="none"></rect>
                            <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="1.5"></line>
                        </svg>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '800', marginBottom: '4px', position: 'relative' }}>{stats.total}</div>
                    <div style={{ fontSize: '14px', opacity: 0.95, fontWeight: '600' }}>นัดหมายทั้งหมด</div>
                </div>
                
                {/* Pending */}
                <div 
                    onClick={() => setStatusFilter('pending')}
                    style={{ 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                        padding: '24px', 
                        borderRadius: '20px', 
                        boxShadow: statusFilter === 'pending' ? '0 0 0 4px rgba(245, 158, 11, 0.5), 0 8px 25px rgba(245, 158, 11, 0.35)' : '0 8px 25px rgba(245, 158, 11, 0.35)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'pointer'
                    }}
                    className="stat-card"
                >
                    <div style={{ 
                        position: 'absolute', 
                        right: '-20px', 
                        top: '-20px', 
                        width: '100px', 
                        height: '100px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '50%' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        right: '20px', 
                        bottom: '15px', 
                        opacity: 0.3
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '800', marginBottom: '4px', position: 'relative' }}>{stats.pending}</div>
                    <div style={{ fontSize: '14px', opacity: 0.95, fontWeight: '600' }}>รอยืนยัน</div>
                </div>
                
                {/* Confirmed */}
                <div 
                    onClick={() => setStatusFilter('confirmed')}
                    style={{ 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        padding: '24px', 
                        borderRadius: '20px', 
                        boxShadow: statusFilter === 'confirmed' ? '0 0 0 4px rgba(16, 185, 129, 0.5), 0 8px 25px rgba(16, 185, 129, 0.35)' : '0 8px 25px rgba(16, 185, 129, 0.35)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'pointer'
                    }}
                    className="stat-card"
                >
                    <div style={{ 
                        position: 'absolute', 
                        right: '-20px', 
                        top: '-20px', 
                        width: '100px', 
                        height: '100px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '50%' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        right: '20px', 
                        bottom: '15px', 
                        opacity: 0.3
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '800', marginBottom: '4px', position: 'relative' }}>{stats.confirmed}</div>
                    <div style={{ fontSize: '14px', opacity: 0.95, fontWeight: '600' }}>ยืนยันแล้ว</div>
                </div>
                
                {/* Completed */}
                <div 
                    onClick={() => setStatusFilter('completed')}
                    style={{ 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                        padding: '24px', 
                        borderRadius: '20px', 
                        boxShadow: statusFilter === 'completed' ? '0 0 0 4px rgba(59, 130, 246, 0.5), 0 8px 25px rgba(59, 130, 246, 0.35)' : '0 8px 25px rgba(59, 130, 246, 0.35)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'pointer'
                    }}
                    className="stat-card"
                >
                    <div style={{ 
                        position: 'absolute', 
                        right: '-20px', 
                        top: '-20px', 
                        width: '100px', 
                        height: '100px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '50%' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        right: '20px', 
                        bottom: '15px', 
                        opacity: 0.3
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '800', marginBottom: '4px', position: 'relative' }}>{stats.completed}</div>
                    <div style={{ fontSize: '14px', opacity: 0.95, fontWeight: '600' }}>เสร็จสิ้น</div>
                </div>
                
                {/* Cancelled */}
                <div 
                    onClick={() => setStatusFilter('cancelled')}
                    style={{ 
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                        padding: '24px', 
                        borderRadius: '20px', 
                        boxShadow: statusFilter === 'cancelled' ? '0 0 0 4px rgba(239, 68, 68, 0.5), 0 8px 25px rgba(239, 68, 68, 0.35)' : '0 8px 25px rgba(239, 68, 68, 0.35)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        cursor: 'pointer'
                    }}
                    className="stat-card"
                >
                    <div style={{ 
                        position: 'absolute', 
                        right: '-20px', 
                        top: '-20px', 
                        width: '100px', 
                        height: '100px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '50%' 
                    }}></div>
                    <div style={{ 
                        position: 'absolute', 
                        right: '20px', 
                        bottom: '15px', 
                        opacity: 0.3
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '800', marginBottom: '4px', position: 'relative' }}>{stats.cancelled}</div>
                    <div style={{ fontSize: '14px', opacity: 0.95, fontWeight: '600' }}>ปฏิเสธ</div>
                </div>
            </div>

            {/* CSS for hover effects */}
            <style>{`
                .stat-card:hover {
                    transform: translateY(-5px);
                }
            `}</style>

            {/* Filters - Clean Design */}
            <div style={{ 
                background: 'white', 
                padding: '16px 20px', 
                borderRadius: '12px', 
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Search */}
                <div style={{ flex: '1', minWidth: '250px', maxWidth: '500px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder={t('searchPlaceholderAppointmentHistory')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 14px 10px 40px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            backgroundColor: '#f9fafb'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#6366f1';
                            e.target.style.backgroundColor = 'white';
                            e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#f9fafb';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {/* Filters Group */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '10px 36px 10px 14px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            minWidth: '140px',
                            cursor: 'pointer',
                            backgroundColor: '#f9fafb',
                            color: '#374151',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center'
                        }}
                    >
                        <option value="all">สถานะทั้งหมด</option>
                        <option value="pending">รอยืนยัน</option>
                        <option value="confirmed">ยืนยันแล้ว</option>
                        <option value="completed">เสร็จสิ้น</option>
                        <option value="cancelled">ยกเลิก</option>
                    </select>

                    {/* Date Filter */}
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{
                            padding: '10px 14px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            cursor: 'pointer',
                            backgroundColor: '#f9fafb',
                            color: '#374151'
                        }}
                    />

                    {/* Clear Filters */}
                    {(searchTerm || statusFilter !== 'all' || dateFilter) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setDateFilter('');
                            }}
                            style={{
                                padding: '10px 16px',
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                color: '#dc2626',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#fecaca'}
                            onMouseLeave={(e) => e.target.style.background = '#fee2e2'}
                        >
                            <span>✕</span> ล้าง
                        </button>
                    )}
                </div>
            </div>

            {/* Appointments Table */}
            <div style={{ 
                background: 'white', 
                borderRadius: '24px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '18px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 7V4h16v3"></path>
                                            <path d="M9 20h6"></path>
                                            <path d="M12 4v16"></path>
                                        </svg>
                                        รหัสนัดหมาย
                                    </div>
                                </th>
                                <th style={{ padding: '18px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        คนไข้
                                    </div>
                                </th>
                                <th style={{ padding: '18px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                        </svg>
                                        คลินิก / แพทย์
                                    </div>
                                </th>
                                <th style={{ padding: '18px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <CalendarIcon />
                                        วันที่นัด
                                    </div>
                                </th>
                                <th style={{ padding: '18px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <ClockIcon />
                                        เวลา
                                    </div>
                                </th>
                                <th style={{ padding: '18px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        สถานะ
                                    </div>
                                </th>
                                <th style={{ padding: '18px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2v4"></path>
                                            <path d="M12 18v4"></path>
                                            <path d="M4.93 4.93l2.83 2.83"></path>
                                            <path d="M16.24 16.24l2.83 2.83"></path>
                                            <path d="M2 12h4"></path>
                                            <path d="M18 12h4"></path>
                                        </svg>
                                        วันที่สร้าง
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '80px 20px', textAlign: 'center', color: '#9ca3af' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ 
                                                width: '80px', 
                                                height: '80px', 
                                                borderRadius: '50%', 
                                                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.2)'
                                            }}>
                                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '16px', color: '#64748b', fontWeight: '600' }}>ไม่พบข้อมูลนัดหมาย</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>ลองปรับตัวกรองใหม่</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments.map((apt, index) => (
                                    <tr 
                                        key={apt.id || index} 
                                        className="table-row-hover"
                                        style={{ 
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <td style={{ padding: '18px 20px', fontSize: '14px', color: '#1e293b', fontWeight: '600', textAlign: 'center' }}>
                                            <span style={{ 
                                                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                                                padding: '6px 12px', 
                                                borderRadius: '8px',
                                                fontFamily: 'monospace',
                                                fontSize: '13px',
                                                color: '#475569'
                                            }}>
                                                #{apt.id?.toString().slice(-6) || String(index + 1).padStart(6, '0')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '14px',
                                                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#4f46e5',
                                                    fontWeight: '700',
                                                    fontSize: '16px',
                                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                                                }}>
                                                    {apt.patientName?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                                        {apt.patientName || 'ไม่ระบุชื่อ'}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                                        {apt.patientPhone || apt.phone || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                                {apt.clinicName || '-'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: '500', marginTop: '2px' }}>
                                                {apt.doctorName || apt.specialty || '-'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                            <div style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                fontSize: '14px', 
                                                color: '#1e293b',
                                                background: '#f8fafc',
                                                padding: '6px 12px',
                                                borderRadius: '8px'
                                            }}>
                                                <CalendarIcon />
                                                {formatDate(apt.date)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                            <div style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                fontSize: '14px', 
                                                color: '#1e293b',
                                                background: '#f8fafc',
                                                padding: '6px 12px',
                                                borderRadius: '8px'
                                            }}>
                                                <ClockIcon />
                                                {apt.time || '-'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                            {getStatusBadge(apt.status)}
                                        </td>
                                        <td style={{ padding: '18px 20px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                                            {formatDate(apt.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* CSS for table hover */}
            <style>{`
                .table-row-hover:hover {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
                }
            `}</style>

            {/* Result count */}
            <div style={{ 
                marginTop: '20px', 
                fontSize: '14px', 
                color: '#64748b', 
                textAlign: 'right',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span>แสดง</span>
                <span style={{ fontWeight: '600', color: '#3b82f6' }}>{filteredAppointments.length}</span>
                <span>จาก</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{appointments.length}</span>
                <span>รายการ</span>
            </div>
        </div>
    );
}

export default AppointmentHistory;
