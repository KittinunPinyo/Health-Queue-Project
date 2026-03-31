import { Router } from 'express';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

function mapDoctorRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty || '',
    phone: row.phone || '',
    email: row.email || '',
    hospitalId: row.hospital_id ?? null,
    hospital: row.hospital || row.hospital_name || '',
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
        phone = '',
        email = '',
        hospitalId = null,
        hospital = '',
        image = '',
      } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const resolvedHospital = await resolveHospitalContext({ hospitalId, hospital });

      const insertResult = await dbInsert(
        `INSERT INTO doctors
          (name, specialty, phone, email, hospital_id, hospital, image, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          name.trim(),
          specialty.trim(),
          phone.trim(),
          email.trim(),
          resolvedHospital.hospitalId,
          resolvedHospital.hospital,
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
        phone,
        email,
        hospitalId,
        hospital,
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

  router.post('/:id/image', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size must not exceed 2MB' });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const existing = await dbGet('SELECT id FROM doctors WHERE id = ?', [req.params.id]);
      if (!existing) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
      }

      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      await dbRun(
        'UPDATE doctors SET image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [base64, req.params.id]
      );

      const updated = await dbGet(
        `SELECT d.*, h.name AS hospital_name
         FROM doctors d
         LEFT JOIN hospitals h ON h.id = d.hospital_id
         WHERE d.id = ?`,
        [req.params.id]
      );

      return res.json({ message: 'Doctor image updated', doctor: mapDoctorRow(updated) });
    } catch (err) {
      console.error('POST /api/doctors/:id/image error:', err);
      return res.status(500).json({ error: 'Unable to update doctor image' });
    }
  });

  return router;
}
