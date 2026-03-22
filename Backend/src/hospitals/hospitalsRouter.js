import { Router } from 'express';

export function createHospitalsRouter({ db, dbGet, dbAll, dbRun }) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const hospitals = await dbAll('SELECT * FROM hospitals ORDER BY id ASC');
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

      const insertResult = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO hospitals (name, address, phone, email, website, logo, image, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [name.trim(), address.trim(), phone.trim(), email.trim(), website.trim(), logo.trim(), logo.trim()],
          function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID });
          }
        );
      });

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

  return router;
}
