import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    { id: user.id, email: user.email, role: user.role, name: user.name },
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
export function createUserRouter({ db, dbGet, jwtSecret }) {
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

    // sqlite3.run ใช้ callback จึงห่อด้วย Promise เพื่อให้ใช้ await ได้
    const result = await new Promise((resolve, reject) => {
      db.run(
        `
          INSERT INTO users (name, email, password, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies, role)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'patient')
        `,
        [name, email, hashedPassword, idCard, dateOfBirth, age, gender, height, weight, medicalConditions, allergies],
        function onInsert(err) {
          if (err) return reject(err);
          return resolve({ lastID: this.lastID });
        }
      );
    });

    return dbGet(
      'SELECT id, name, email, role, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies FROM users WHERE id = ?',
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
      'SELECT id, name, email, role, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies FROM users WHERE id = ?',
      [id]
    );
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

  return router;
}