import { Router } from 'express';

function mapDoctorRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty || '',
    licenseNumber: row.license_number || '',
    phone: row.phone || '',
    email: row.email || '',
    hospitalId: row.hospital_id ?? null,
    hospital: row.hospital || row.hospital_name || '',
    experienceYears: row.experience_years ?? 0,
    image: row.image || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createDoctorsRouter({ dbGet, dbAll, dbRun, dbInsert }) {
  const router = Router();

  async function resolveHospitalContext({ hospitalId, hospital }) {
    let resolvedHospitalId = hospitalId ?? null;
    let resolvedHospitalName = (hospital || '').trim();

    if (resolvedHospitalId !== null && resolvedHospitalId !== undefined && resolvedHospitalId !== '') {
      const found = await dbGet('SELECT id, name FROM hospitals WHERE id = ?', [resolvedHospitalId]);
      if (!found) {
        throw new Error('Hospital not found');
      }
      resolvedHospitalId = found.id;
      resolvedHospitalName = found.name;
      return { hospitalId: resolvedHospitalId, hospital: resolvedHospitalName };
    }

    if (resolvedHospitalName) {
      const foundByName = await dbGet('SELECT id, name FROM hospitals WHERE LOWER(name) = LOWER(?)', [resolvedHospitalName]);
      if (foundByName) {
        resolvedHospitalId = foundByName.id;
        resolvedHospitalName = foundByName.name;
      }
    }

    return { hospitalId: resolvedHospitalId, hospital: resolvedHospitalName };
  }

  router.get('/', async (req, res) => {
    try {
      const { hospitalId } = req.query;
      let query = `
        SELECT d.*, h.name AS hospital_name
        FROM doctors d
        LEFT JOIN hospitals h ON h.id = d.hospital_id
      `;
      const params = [];

      if (hospitalId) {
        query += ' WHERE d.hospital_id = ?';
        params.push(hospitalId);
      }

      query += ' ORDER BY d.id ASC';

      const rows = await dbAll(query, params);
      const doctors = rows.map(mapDoctorRow);
      return res.json({ doctors });
    } catch (err) {
      console.error('GET /api/doctors error:', err);
      return res.status(500).json({ error: 'Unable to fetch doctors' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const row = await dbGet(
        `
          SELECT d.*, h.name AS hospital_name
          FROM doctors d
          LEFT JOIN hospitals h ON h.id = d.hospital_id
          WHERE d.id = ?
        `,
        [req.params.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      return res.json({ doctor: mapDoctorRow(row) });
    } catch (err) {
      console.error('GET /api/doctors/:id error:', err);
      return res.status(500).json({ error: 'Unable to fetch doctor' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const {
        name,
        specialty = '',
        licenseNumber = '',
        phone = '',
        email = '',
        hospitalId = null,
        hospital = '',
        experienceYears = 0,
        image = '',
      } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const resolvedHospital = await resolveHospitalContext({ hospitalId, hospital });

      const insertResult = await dbInsert(
        `INSERT INTO doctors
          (name, specialty, license_number, phone, email, hospital_id, hospital, experience_years, image, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          name.trim(),
          specialty.trim(),
          licenseNumber.trim(),
          phone.trim(),
          email.trim(),
          resolvedHospital.hospitalId,
          resolvedHospital.hospital,
          Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : 0,
          image.trim(),
        ]
      );

      const created = await dbGet(
        `
          SELECT d.*, h.name AS hospital_name
          FROM doctors d
          LEFT JOIN hospitals h ON h.id = d.hospital_id
          WHERE d.id = ?
        `,
        [insertResult.lastID]
      );

      return res.status(201).json({ message: 'Doctor created', doctor: mapDoctorRow(created) });
    } catch (err) {
      if (err.message === 'Hospital not found') {
        return res.status(400).json({ error: 'Hospital not found' });
      }
      console.error('POST /api/doctors error:', err);
      return res.status(500).json({ error: 'Unable to create doctor' });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const existing = await dbGet('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
      if (!existing) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      const {
        name,
        specialty,
        licenseNumber,
        phone,
        email,
        hospitalId,
        hospital,
        experienceYears,
        image,
      } = req.body;

      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(String(name).trim());
      }
      if (specialty !== undefined) {
        updates.push('specialty = ?');
        params.push(String(specialty).trim());
      }
      if (licenseNumber !== undefined) {
        updates.push('license_number = ?');
        params.push(String(licenseNumber).trim());
      }
      if (phone !== undefined) {
        updates.push('phone = ?');
        params.push(String(phone).trim());
      }
      if (email !== undefined) {
        updates.push('email = ?');
        params.push(String(email).trim());
      }
      if (image !== undefined) {
        updates.push('image = ?');
        params.push(String(image).trim());
      }
      if (experienceYears !== undefined) {
        updates.push('experience_years = ?');
        params.push(Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : 0);
      }

      if (hospitalId !== undefined || hospital !== undefined) {
        const resolvedHospital = await resolveHospitalContext({ hospitalId, hospital });
        updates.push('hospital_id = ?');
        params.push(resolvedHospital.hospitalId);
        updates.push('hospital = ?');
        params.push(resolvedHospital.hospital);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'At least one field required for update' });
      }

      params.push(req.params.id);
      const query = `UPDATE doctors SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await dbRun(query, params);

      const updated = await dbGet(
        `
          SELECT d.*, h.name AS hospital_name
          FROM doctors d
          LEFT JOIN hospitals h ON h.id = d.hospital_id
          WHERE d.id = ?
        `,
        [req.params.id]
      );

      return res.json({ message: 'Doctor updated', doctor: mapDoctorRow(updated) });
    } catch (err) {
      if (err.message === 'Hospital not found') {
        return res.status(400).json({ error: 'Hospital not found' });
      }
      console.error('PUT /api/doctors/:id error:', err);
      return res.status(500).json({ error: 'Unable to update doctor' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const existing = await dbGet('SELECT id FROM doctors WHERE id = ?', [req.params.id]);
      if (!existing) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      await dbRun('DELETE FROM doctors WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Doctor deleted' });
    } catch (err) {
      console.error('DELETE /api/doctors/:id error:', err);
      return res.status(500).json({ error: 'Unable to delete doctor' });
    }
  });

  return router;
}
