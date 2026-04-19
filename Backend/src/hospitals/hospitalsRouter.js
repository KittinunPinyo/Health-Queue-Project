import { Router } from 'express';

export function createHospitalsRouter({ dbGet, dbAll, dbRun, dbInsert }) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const sort = String(req.query.sort || '').toLowerCase();
      let hospitals;

      if (sort === 'doctors') {
        hospitals = await dbAll(`
          SELECT h.*, COUNT(DISTINCT d.id) AS doctor_count, COUNT(DISTINCT f.id) AS favorite_count
          FROM hospitals h
          LEFT JOIN doctors d ON h.id = d.hospital_id
          LEFT JOIN favorites f ON h.id = f.hospital_id
          GROUP BY h.id
          ORDER BY favorite_count DESC, doctor_count DESC, h.id ASC
        `);
      } else {
        hospitals = await dbAll('SELECT * FROM hospitals ORDER BY id ASC');
      }

      return res.json({ hospitals });
    } catch (err) {
      console.error('GET /api/hospitals error:', err);
      return res.status(500).json({ error: 'Unable to fetch hospitals' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const hospital = await dbGet('SELECT * FROM hospitals WHERE id = ?', [req.params.id]);
      if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
      return res.json({ hospital });
    } catch (err) {
      console.error('GET /api/hospitals/:id error:', err);
      return res.status(500).json({ error: 'Unable to fetch hospital' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { name, address = '', phone = '', email = '', website = '', logo = '' } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const insertResult = await dbInsert(
        `INSERT INTO hospitals (name, address, phone, email, website, logo, image, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [name.trim(), address.trim(), phone.trim(), email.trim(), website.trim(), logo.trim(), logo.trim()]
      );

      const hospital = await dbGet('SELECT * FROM hospitals WHERE id = ?', [insertResult.lastID]);
      return res.status(201).json({ message: 'Hospital created', hospital });
    } catch (err) {
      console.error('POST /api/hospitals error:', err);
      return res.status(500).json({ error: 'Unable to create hospital' });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { name, address, phone, email, website, logo } = req.body;
      const updates = [];
      const params = [];

      if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
      if (address !== undefined) { updates.push('address = ?'); params.push(address.trim()); }
      if (phone !== undefined) { updates.push('phone = ?'); params.push(phone.trim()); }
      if (email !== undefined) { updates.push('email = ?'); params.push(email.trim()); }
      if (website !== undefined) { updates.push('website = ?'); params.push(website.trim()); }
      if (logo !== undefined) { updates.push('logo = ?'); params.push(logo.trim()); updates.push('image = ?'); params.push(logo.trim()); }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'At least one field required for update' });
      }

      params.push(req.params.id);
      const query = `UPDATE hospitals SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await dbRun(query, params);

      const hospital = await dbGet('SELECT * FROM hospitals WHERE id = ?', [req.params.id]);
      if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
      return res.json({ message: 'Hospital updated', hospital });
    } catch (err) {
      console.error('PUT /api/hospitals/:id error:', err);
      return res.status(500).json({ error: 'Unable to update hospital' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const hospital = await dbGet('SELECT * FROM hospitals WHERE id = ?', [req.params.id]);
      if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

      await dbRun('DELETE FROM hospitals WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Hospital deleted' });
    } catch (err) {
      console.error('DELETE /api/hospitals/:id error:', err);
      return res.status(500).json({ error: 'Unable to delete hospital' });
    }
  });

  router.post('/:id/logo', async (req, res) => {
    try {
      const { logo } = req.body;
      if (!logo || typeof logo !== 'string') {
        return res.status(400).json({ error: 'Logo URL is required' });
      }

      const hospital = await dbGet('SELECT * FROM hospitals WHERE id = ?', [req.params.id]);
      if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

      await dbRun('UPDATE hospitals SET logo = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [logo.trim(), logo.trim(), req.params.id]);
      const updated = await dbGet('SELECT * FROM hospitals WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Logo updated', hospital: updated });
    } catch (err) {
      console.error('POST /api/hospitals/:id/logo error:', err);
      return res.status(500).json({ error: 'Unable to update logo' });
    }
  });

  router.post('/:id/favorite', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const hospital = await dbGet('SELECT id FROM hospitals WHERE id = ?', [req.params.id]);
      if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

      const existing = await dbGet(
        'SELECT id FROM favorites WHERE user_id = ? AND hospital_id = ?',
        [userId, req.params.id]
      );
      
      if (existing) {
        return res.status(200).json({ message: 'Already in favorites', isFavorite: true });
      }

      await dbRun(
        'INSERT INTO favorites (user_id, hospital_id) VALUES (?, ?)',
        [userId, req.params.id]
      );

      return res.status(201).json({ message: 'Added to favorites', isFavorite: true });
    } catch (err) {
      console.error('POST /api/hospitals/:id/favorite error:', err);
      return res.status(500).json({ error: 'Unable to add to favorites' });
    }
  });

  router.delete('/:id/favorite', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const hospital = await dbGet('SELECT id FROM hospitals WHERE id = ?', [req.params.id]);
      if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

      await dbRun(
        'DELETE FROM favorites WHERE user_id = ? AND hospital_id = ?',
        [userId, req.params.id]
      );

      return res.json({ message: 'Removed from favorites', isFavorite: false });
    } catch (err) {
      console.error('DELETE /api/hospitals/:id/favorite error:', err);
      return res.status(500).json({ error: 'Unable to remove from favorites' });
    }
  });

  return router;
}
