import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// เข้ารหัสรหัสผ่านก่อนบันทึกลงฐานข้อมูล
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// เปรียบเทียบรหัสผ่านที่ผู้ใช้กรอกกับ hash ที่เก็บในฐานข้อมูล
async function verifyPassword(password, hashed) {
  return bcrypt.compare(password, hashed);
}

// สร้าง JWT หลัง login สำเร็จ
function generateToken(user, jwtSecret) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sid: randomUUID(),
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
}

// ตรวจสอบว่า JWT ถูกต้องและยังไม่หมดอายุ
function verifyToken(token, jwtSecret) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

export { hashPassword };

function createAuthenticateToken(jwtSecret) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token, jwtSecret);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  };
}

function createAuthorizeAdmin() {
  return (req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  };
}

const getAllUsers = async (dbAll) => {
  return dbAll(
    `SELECT id, name, email, phone, role, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies
     FROM users
     ORDER BY id ASC`
  );
};

export function createAuthRouter({ dbGet, dbInsert, jwtSecret }) {
  const router = Router();

  const registerUser = async (userData) => {
    const {
      name,
      email,
      password,
      phone,
      idCard,
      dateOfBirth,
      age,
      gender,
      height,
      weight,
      medicalConditions,
      allergies,
    } = userData;

    const existingUser = await dbGet('SELECT id FROM users WHERE email = ? OR id_card = ?', [email, idCard]);
    if (existingUser) {
      throw new Error('User already exists with this email or ID card');
    }

    const hashedPassword = await hashPassword(password);

    const result = await dbInsert(
      `INSERT INTO users (name, email, password, phone, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'patient')`,
      [name, email, hashedPassword, phone || null, idCard, dateOfBirth, age, gender, height, weight, medicalConditions, allergies]
    );

    return dbGet(
      'SELECT id, name, email, phone, role, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies FROM users WHERE id = ?',
      [result.lastID]
    );
  };

  const loginUser = async (email, password) => {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) throw new Error('User not found');

    const valid = await verifyPassword(password, user.password);
    if (!valid) throw new Error('Invalid password');

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  };

  router.post('/register', async (req, res) => {
    try {
      const user = await registerUser(req.body);
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await loginUser(email, password);
      const token = generateToken(user, jwtSecret);
      res.json({ message: 'Login successful', user, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  });

  router.post('/logout', createAuthenticateToken(jwtSecret), (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });

  router.get('/profile', createAuthenticateToken(jwtSecret), async (req, res) => {
    try {
      const user = await dbGet(
        'SELECT id, name, email, phone, role, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies FROM users WHERE id = ?',
        [req.user.id]
      );
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ user });
    } catch (error) {
      console.error('Auth profile error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

export function createUserRouter({ dbGet, dbAll, dbRun, jwtSecret }) {
  const router = Router();
  const authenticateToken = createAuthenticateToken(jwtSecret);
  const authorizeAdmin = createAuthorizeAdmin();

  const getUserById = async (id) => {
    return dbGet(
      'SELECT id, name, email, phone, role, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies FROM users WHERE id = ?',
      [id]
    );
  };

  const updateUserProfile = async (id, payload) => {
    const existing = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      throw new Error('User not found');
    }

    const toNullableString = (value, fallback = null) => {
      if (value === undefined) return fallback;
      if (value === null) return null;
      const str = String(value).trim();
      return str === '' ? null : str;
    };

    const toNullableNumber = (value, fallback = null) => {
      if (value === undefined) return fallback;
      if (value === null || value === '') return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : fallback;
    };

    const nextName = toNullableString(payload.name, existing.name);
    if (!nextName) {
      throw new Error('Name is required');
    }

    await dbRun(
      `UPDATE users
       SET name = ?,
           phone = ?,
           id_card = ?,
           date_of_birth = ?,
           age = ?,
           gender = ?,
           height = ?,
           weight = ?,
           medical_conditions = ?,
           allergies = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        toNullableString(payload.name, existing.name),
        toNullableString(payload.phone, existing.phone),
        toNullableString(payload.idCard, existing.id_card),
        toNullableString(payload.dateOfBirth, existing.date_of_birth),
        toNullableNumber(payload.age, existing.age),
        toNullableString(payload.gender, existing.gender),
        toNullableNumber(payload.height, existing.height),
        toNullableNumber(payload.weight, existing.weight),
        toNullableString(payload.medicalConditions, existing.medical_conditions),
        toNullableString(payload.allergies, existing.allergies),
        id,
      ]
    );

    return getUserById(id);
  };

  const changeUserPassword = async (id, currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      throw new Error('Current and new password are required');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    const user = await dbGet('SELECT id, password FROM users WHERE id = ?', [id]);
    if (!user) {
      throw new Error('User not found');
    }

    const validCurrent = await verifyPassword(currentPassword, user.password);
    if (!validCurrent) {
      throw new Error('Current password is incorrect');
    }

    const nextHashed = await hashPassword(newPassword);
    await dbRun('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextHashed, id]);
  };

  const deleteUserAccount = async (id) => {
    await dbRun('DELETE FROM appointments WHERE user_id = ?', [id]);
    await dbRun('DELETE FROM users WHERE id = ?', [id]);
  };

  router.get('/list', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
      const users = await getAllUsers(dbAll);
      return res.json({ users });
    } catch (error) {
      console.error('GET /api/user/list error:', error);
      return res.status(500).json({ error: 'Unable to fetch users' });
    }
  });

  router.get('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
      const user = await getUserById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } catch (error) {
      console.error('GET /api/user/:id error:', error);
      return res.status(500).json({ error: 'Unable to fetch user' });
    }
  });

  router.put('/:id/role', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
      const { role } = req.body || {};
      const allowedRoles = ['patient', 'doctor', 'admin'];

      if (!role || typeof role !== 'string' || !allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Role must be one of patient, doctor, admin' });
      }

      const existing = await dbGet('SELECT id FROM users WHERE id = ?', [req.params.id]);
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      await dbRun('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, req.params.id]);
      const updated = await getUserById(req.params.id);
      return res.json({ message: 'User role updated', user: updated });
    } catch (error) {
      console.error('PUT /api/user/:id/role error:', error);
      return res.status(500).json({ error: 'Unable to update role' });
    }
  });

  router.get('/profile', authenticateToken, async (req, res) => {
    try {
      const user = await getUserById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } catch (error) {
      console.error('Profile error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.put('/profile', authenticateToken, async (req, res) => {
    try {
      const user = await updateUserProfile(req.user.id, req.body || {});
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(400).json({ error: error.message });
    }
  });

  router.put('/password', authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      await changeUserPassword(req.user.id, currentPassword, newPassword);
      return res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(400).json({ error: error.message });
    }
  });

  router.delete('/account', authenticateToken, async (req, res) => {
    try {
      await deleteUserAccount(req.user.id);
      return res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      return res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  // ดึงรายชื่อโปรดของผู้ใช้: GET /:id/favorites
  router.get('/:id/favorites', async (req, res) => {
    try {
      const userId = req.params.id;
      
      const favorites = await dbAll(
        `SELECT h.* FROM hospitals h
         INNER JOIN favorites f ON h.id = f.hospital_id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`,
        [userId]
      );

      return res.json({ favorites, count: favorites.length });
    } catch (error) {
      console.error('GET /api/users/:id/favorites error:', error);
      return res.status(500).json({ error: 'Unable to fetch favorites' });
    }
  });

  return router;
}
