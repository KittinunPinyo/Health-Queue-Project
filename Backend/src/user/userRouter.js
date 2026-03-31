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

// สร้าง router ของกลุ่ม API ผู้ใช้ (register/login/profile/logout)
export function createUserRouter({ dbGet, dbInsert, dbRun, jwtSecret }) {
  const router = Router();

  // middleware ตรวจ token สำหรับ endpoint ที่ต้องล็อกอิน
  const authenticateToken = (req, res, next) => {
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

    // กันข้อมูลซ้ำด้วย email หรือเลขบัตรประชาชน
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

    // ไม่ส่ง password กลับให้ client
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  };

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

    const nextPhone = toNullableString(payload.phone, existing.phone);
    const nextIdCard = toNullableString(payload.idCard, existing.id_card);
    const nextDob = toNullableString(payload.dateOfBirth, existing.date_of_birth);
    const nextAge = toNullableNumber(payload.age, existing.age);
    const nextGender = toNullableString(payload.gender, existing.gender);
    const nextHeight = toNullableNumber(payload.height, existing.height);
    const nextWeight = toNullableNumber(payload.weight, existing.weight);
    const nextConditions = toNullableString(payload.medicalConditions, existing.medical_conditions);
    const nextAllergies = toNullableString(payload.allergies, existing.allergies);

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
        nextName,
        nextPhone,
        nextIdCard,
        nextDob,
        nextAge,
        nextGender,
        nextHeight,
        nextWeight,
        nextConditions,
        nextAllergies,
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
    await dbRun(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nextHashed, id]
    );
  };

  const deleteUserAccount = async (id) => {
    // ลบข้อมูลนัดหมายที่ผูกกับผู้ใช้ก่อน เพื่อไม่ชน foreign key
    await dbRun('DELETE FROM appointments WHERE user_id = ?', [id]);
    await dbRun('DELETE FROM users WHERE id = ?', [id]);
  };

  // สมัครสมาชิกผู้ใช้ใหม่
  router.post('/register', async (req, res) => {
    try {
      const user = await registerUser(req.body);
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // เข้าสู่ระบบและส่ง token กลับ
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

  // ดึงข้อมูล profile ของผู้ใช้ที่ login อยู่
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

  // endpoint ออกจากระบบ (ฝั่งนี้ตอบสถานะสำเร็จ)
  router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });

  // แก้ไขชื่อ/เบอร์โทรของผู้ใช้ที่ล็อกอินอยู่
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

  // เปลี่ยนรหัสผ่าน (ใช้ bcrypt)
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

  // ลบบัญชีผู้ใช้ที่ล็อกอินอยู่
  router.delete('/account', authenticateToken, async (req, res) => {
    try {
      await deleteUserAccount(req.user.id);
      return res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      return res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  return router;
}