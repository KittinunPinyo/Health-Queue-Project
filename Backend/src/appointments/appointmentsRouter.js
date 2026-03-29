import { Router } from 'express';

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getPrimarySlot(appointments = []) {
  const firstValid = appointments.find((slot) => slot?.date && slot?.time);
  return {
    date: firstValid?.date || null,
    time: firstValid?.time || null,
  };
}

function normalizeDate(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return raw.slice(0, 10);  
}

function normalizeTime(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  return raw.slice(0, 5);
}

function mapAppointmentRow(row) {
  if (!row) return null;

  return {
    id: row.source_request_id || String(row.id),
    status: row.status,
    patient: {
      id: row.user_id,
      name: row.patient_name || '',
      email: row.patient_email || '',
      phone: row.patient_phone || '',
      idCard: row.patient_id_card || '',
    },
    clinic: {
      id: row.clinic_id,
      name: row.clinic_name || '',
    },
    appointmentType: row.appointment_type || '',
    doctorSelectionType: row.doctor_selection_type || '',
    selectedSpecialty: row.selected_specialty || '',
    selectedSpecialtyDetail: row.selected_specialty_detail || '',
    selectedDoctor: row.selected_doctor || '',
    appointments: normalizeArray(row.appointments_json),
    date: normalizeDate(row.appointment_date),
    time: normalizeTime(row.appointment_time),
    symptoms: row.symptoms || '',
    attachedFiles: normalizeArray(row.attached_files_json),
    relationship: row.relationship || '',
    gender: row.gender || '',
    birthDate: normalizeDate(row.birth_date),
    nationality: row.nationality || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createAppointmentsRouter({ dbAll, dbGet, dbInsert }) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const { userId } = req.query;
      let sql = 'SELECT * FROM appointments';
      const params = [];

      if (userId) {
        sql += ' WHERE user_id = ?';
        params.push(userId);
      }

      sql += ' ORDER BY created_at DESC, id DESC';
      const rows = await dbAll(sql, params);
      return res.json(rows.map(mapAppointmentRow));
    } catch (error) {
      console.error('GET /api/appointments error:', error);
      return res.status(500).json({ error: 'Unable to fetch appointments' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const {
        id,
        status = 'new',
        patient,
        clinic,
        appointmentType = '',
        doctorSelectionType = '',
        selectedSpecialty = '',
        selectedSpecialtyDetail = '',
        selectedDoctor = '',
        appointments = [],
        date,
        time,
        symptoms = '',
        attachedFiles = [],
        relationship = '',
        gender = '',
        birthDate = '',
        nationality = '',
      } = req.body || {};

      const patientId = patient?.id;
      const clinicId = clinic?.id;
      const clinicName = clinic?.name || '';
      const patientName = patient?.name || '';

      if (!patientId) {
        return res.status(400).json({ error: 'patient.id is required' });
      }

      if (!clinicId) {
        return res.status(400).json({ error: 'clinic.id is required' });
      }

      const validAppointments = normalizeArray(appointments).filter((slot) => slot?.date && slot?.time);
      const primarySlot = getPrimarySlot(validAppointments);
      const finalDate = date || primarySlot.date;
      const finalTime = time || primarySlot.time;

      if (!finalDate || !finalTime) {
        return res.status(400).json({ error: 'At least one appointment date/time is required' });
      }

      const payload = {
        id,
        status,
        patient,
        clinic,
        appointmentType,
        doctorSelectionType,
        selectedSpecialty,
        selectedSpecialtyDetail,
        selectedDoctor,
        appointments: validAppointments,
        date: finalDate,
        time: finalTime,
        symptoms,
        attachedFiles: normalizeArray(attachedFiles),
        relationship,
        gender,
        birthDate,
        nationality,
      };

      const insertResult = await dbInsert(
        `INSERT INTO appointments (
          source_request_id,
          user_id,
          clinic_id,
          clinic_name,
          patient_name,
          patient_email,
          patient_phone,
          patient_id_card,
          status,
          appointment_type,
          doctor_selection_type,
          selected_specialty,
          selected_specialty_detail,
          selected_doctor,
          appointment_date,
          appointment_time,
          appointments_json,
          symptoms,
          attached_files_json,
          relationship,
          gender,
          birth_date,
          nationality,
          booking_payload,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?::jsonb, ?, ?, ?, ?, ?::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          id || null,
          patientId,
          clinicId,
          clinicName,
          patientName,
          patient?.email || '',
          patient?.phone || '',
          patient?.idCard || '',
          status,
          appointmentType,
          doctorSelectionType,
          selectedSpecialty,
          selectedSpecialtyDetail,
          selectedDoctor,
          finalDate,
          finalTime,
          JSON.stringify(validAppointments),
          symptoms,
          JSON.stringify(normalizeArray(attachedFiles)),
          relationship,
          gender,
          birthDate || null,
          nationality,
          JSON.stringify(payload),
        ]
      );

      const created = await dbGet('SELECT * FROM appointments WHERE id = ?', [insertResult.lastID]);
      return res.status(201).json({ message: 'Appointment created', appointment: mapAppointmentRow(created) });
    } catch (error) {
      console.error('POST /api/appointments error:', error);
      return res.status(500).json({ error: 'Unable to create appointment' });
    }
  });

  return router;
}
