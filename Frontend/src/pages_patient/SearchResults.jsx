import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import './SearchResults.css';

function SearchResults() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search).get('q')?.trim() || '';
  const [searchTerm, setSearchTerm] = useState(query);

  const [clinicsData, setClinicsData] = useState([]);
  const [doctorResults, setDoctorResults] = useState([]);
  const [clinicResults, setClinicResults] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const runSearch = async () => {
      let clinics = [];
      try {
        const [hospitalsRes, doctorsRes] = await Promise.all([
          axios.get('/api/hospitals'),
          axios.get('/api/doctors?sort=popular'),
        ]);
        const hospitals = hospitalsRes.data.hospitals || [];
        const doctors = doctorsRes.data.doctors || [];

        const doctorsByHospital = doctors.reduce((acc, doctor) => {
          const key = String(doctor.hospitalId || '');
          if (!key) return acc;
          if (!acc[key]) acc[key] = [];
          acc[key].push({
            id: doctor.id,
            name: doctor.name || '',
            specialty: doctor.specialty || '',
            email: doctor.email || '',
            image: doctor.image || '',
            appointmentCount: Number(doctor.appointmentCount ?? doctor.appointment_count ?? 0),
          });
          return acc;
        }, {});

        clinics = hospitals.map((h) => ({
          id: h.id,
          name: h.name,
          image: h.image || h.logo || 'https://placehold.co/600x400/eeeeee/888888?text=No+Image',
          doctors: doctorsByHospital[String(h.id)] || [],
          ...h,
        }));

        clinics.forEach((clinic) => {
          clinic.doctors = (clinic.doctors || []).slice().sort((a, b) => (b.appointmentCount || 0) - (a.appointmentCount || 0));
        });
      } catch (error) {
        console.error('Search load hospitals/doctors error:', error);
        clinics = [];
      }

      setClinicsData(clinics);

      if (!query) {
        setClinicResults([]);
        setDoctorResults([]);
        return;
      }

      const lowerQuery = query.toLowerCase();

      const matchedClinics = clinics.filter((clinic) => {
        if (clinic.name?.toLowerCase().includes(lowerQuery)) return true;
        if (clinic.doctors?.some((doc) =>
          doc.name?.toLowerCase().includes(lowerQuery) ||
          doc.specialty?.toLowerCase().includes(lowerQuery)
        )) return true;
        return false;
      });

      const matchedDoctors = [];
      clinics.forEach((clinic) => {
        (clinic.doctors || []).forEach((doc) => {
          if (
            doc.name?.toLowerCase().includes(lowerQuery) ||
            doc.specialty?.toLowerCase().includes(lowerQuery)
          ) {
            matchedDoctors.push({ ...doc, clinicId: clinic.id, clinicName: clinic.name, clinicImage: clinic.image });
          }
        });
      });

      matchedDoctors.sort((a, b) => (b.appointmentCount || 0) - (a.appointmentCount || 0));

      setClinicResults(matchedClinics);
      setDoctorResults(matchedDoctors);
    };

    runSearch();
  }, [query]);

  const handleSearch = () => {
    const trimmed = searchTerm.trim();
    navigate(`/patient/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectClinic = (id) => {
    localStorage.setItem('selectedClinicId', id);
    navigate('/patient/clinic-detail');
  };

  const handleBookDoctor = (doctor) => {
    localStorage.setItem('selectedClinicId', doctor.clinicId);
    localStorage.setItem('selectedDoctorId', doctor.id);
    localStorage.setItem('selectedDoctorData', JSON.stringify(doctor));
    navigate('/patient/clinic-detail');
  };

  return (
    <div className="search-results-page">
      <div className="search-results-bg" />
      <div className="search-results-container">
        <button className="search-back-btn" onClick={() => navigate(-1)}>
          {t('back', 'กลับ')}
        </button>

        <div className="search-bar-row">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            placeholder={t('searchPlaceholder', 'พิมพ์คำค้นหา...')}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-submit-btn">
            {t('search', 'ค้นหา')}
          </button>
        </div>

        <div className="search-header-card">
          <h1>
            {t('searchResultsFor', 'ผลการค้นหาสำหรับ')} "{query || t('all', 'ทั้งหมด')}"
          </h1>
          <p>
            {t('totalFound', 'พบทั้งหมด')} <strong>{clinicResults.length}</strong> {t('hospitals', 'โรงพยาบาล/คลินิก')} + <strong>{doctorResults.length}</strong> {t('doctors', 'แพทย์')}
          </p>

          <div className="search-tabs">
            {['all', 'hospitals', 'doctors'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`search-tab-btn ${activeTab === type ? 'active' : ''}`}
              >
                {type === 'all' && t('all', 'ทั้งหมด')}
                {type === 'hospitals' && t('hospitals', 'โรงพยาบาล/คลินิก')}
                {type === 'doctors' && t('doctors', 'แพทย์')}
              </button>
            ))}
          </div>
        </div>

        {(activeTab === 'all' || activeTab === 'hospitals') && clinicResults.length > 0 && (
          <section className="search-section">
            <h2>{t('matchingHospitals', 'โรงพยาบาล/คลินิกที่ค้นพบ')}</h2>
            <div className="clinic-grid">
              {clinicResults.map((clinic) => (
                <div key={clinic.id} className="clinic-card" onClick={() => handleSelectClinic(clinic.id)}>
                  <div className="clinic-image-wrap">
                    <img
                      src={clinic.image}
                      alt={clinic.name}
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/600x400/eeeeee/cccccc?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="clinic-card-body">
                    <h3>{clinic.name}</h3>
                    <p>{clinic.doctors?.length || 0} {t('allDoctors', 'แพทย์')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'doctors') && doctorResults.length > 0 && (
          <section className="search-section">
            <div className="doctor-section-head">
              <h2>{t('matchingDoctors', 'แพทย์ที่ค้นพบ')}</h2>
              <span>{doctorResults.length} {t('resultFound', 'ผลลัพธ์')}</span>
            </div>
            <div className="doctor-grid">
              {doctorResults.map((doctor) => (
                <div key={`${doctor.clinicId}-${doctor.id}`} className="doctor-card">
                  <div className="doctor-card-image">
                    <img src={doctor.image || 'https://placehold.co/150x150/e0e7ff/6366f1?text=Doctor'} alt={doctor.name} />
                  </div>
                  <h3>{doctor.name}</h3>
                  <p className="doctor-specialty">{doctor.specialty || t('noDepartment', 'ยังไม่มีข้อมูลแผนก')}</p>
                  <span className="doctor-clinic">{doctor.clinicName}</span>
                  <div className="doctor-card-actions">
                    <button className="btn-book" onClick={() => handleBookDoctor(doctor)}>
                      📅 {t('bookNow', 'นัดหมาย')}
                    </button>
                    <button className="btn-details">
                      📋 {t('details', 'รายละเอียด')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {clinicResults.length === 0 && doctorResults.length === 0 && (
          <div className="search-empty-state">
            <p>{t('noResultsFor', 'ไม่พบผลลัพธ์สำหรับ')} "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;
