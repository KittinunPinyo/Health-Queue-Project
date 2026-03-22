import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { createUserRouter, hashPassword } from './userRouter.js';
import { createHospitalsRouter } from '../hospitals/hospitalsRouter.js';

/**
 * Backend Server entrypoint
 * -------------------------
 * ไฟล์นี้ดูแลการตั้งค่าเซิร์ฟเวอร์และฐานข้อมูล
 * ส่วน API login/register/profile ถูกย้ายไปไว้ใน src/user/userRouter.js
 */

const app = express();
const PORT = process.env.PORT || 5000;
// คีย์สำหรับเซ็น/ตรวจสอบ JWT (แนะนำให้ตั้งจาก environment จริงตอน production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Database setup
 * ----------------
 * สร้างไฟล์ database.db และตารางผู้ใช้/ตารางนัดหมาย ถ้ายังไม่มี
 */
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
  initializeDatabase();
});

// Promisify sqlite3 methods for async/await convenience
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

async function initializeDatabase() {
  try {
    // สร้างตาราง users สำหรับข้อมูลบัญชีผู้ใช้
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        id_card TEXT,
        date_of_birth DATE,
        age INTEGER,
        gender TEXT,
        height REAL,
        weight REAL,
        medical_conditions TEXT,
        allergies TEXT,
        role TEXT DEFAULT 'patient',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table ready.');

    // สร้างตาราง appointments สำหรับข้อมูลการนัดหมาย
    await dbRun(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        clinic_id INTEGER NOT NULL,
        doctor_name TEXT,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        symptoms TEXT,
        status TEXT DEFAULT 'pending',
        appointment_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    console.log('Appointments table ready.');

    // Seed a default account on a fresh database so login works out-of-the-box.
    const row = await dbGet('SELECT COUNT(*) AS count FROM users');
    if (row?.count === 0) {
      const defaultPassword = await hashPassword('password123');
      await dbRun(
        `
          INSERT INTO users (name, email, password, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies, role)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'patient')
        `,
        ['Test User', 'testuser1@gmail.com', defaultPassword, '1234567890123', '2000-01-01', 26, 'ชาย', 170, 65, '', '',]
      );
      console.log('✅ Default user created: testuser1@gmail.com / password123');
    }

    // สร้างตาราง hospitals สำหรับจัดการโรงพยาบาล/คลินิกตาม API ใหม่
    await dbRun(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        logo TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Hospitals table ready.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

/**
 * Middleware
 * ----------
 * โค้ดส่วนที่ใช้ทั้งระบบ (เช่น CORS, json body parser)
 */
app.use(cors());
app.use(express.json());
// รวมกลุ่ม API login/register/profile ไว้ที่ /api/auth
app.use('/api/auth', createUserRouter({ db, dbGet, jwtSecret: JWT_SECRET }));// รวมกลุ่ม API hospitals ตามรูปตัวอย่าง
app.use('/api/hospitals', createHospitalsRouter({ db, dbGet, dbAll, dbRun }));
/**
 * Routes
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ดัก error กลางของระบบ เช่น JSON ผิดรูปแบบ หรือ error ที่หลุดจาก route
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

