import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createAuthRouter, createUserRouter, hashPassword } from './userRouter.js';
import { openApiDocument } from './swagger.js';
import { createHospitalsRouter } from '../hospitals/hospitalsRouter.js';
import { createDoctorsRouter } from '../doctors/doctorsRouter.js';
import { createAppointmentsRouter } from '../appointments/appointmentsRouter.js';
import pool, { dbGet, dbAll, dbRun, dbInsert } from './db.js';

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
 * สร้างตารางใน PostgreSQL (Neon) ถ้ายังไม่มี
 */
async function initializeDatabase() {
  try {
    // ทดสอบการเชื่อมต่อ
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL (Neon) database.');

    // สร้างตาราง users สำหรับข้อมูลบัญชีผู้ใช้
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        id_card TEXT,
        date_of_birth DATE,
        age INTEGER,
        gender TEXT,
        height REAL,
        weight REAL,
        medical_conditions TEXT,
        allergies TEXT,
        role TEXT DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table ready.');

    // เพิ่มคอลัมน์สำหรับฐานข้อมูลเดิมที่ยังไม่มี
    await dbRun(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);

    // สร้างตาราง appointments สำหรับข้อมูลการนัดหมาย
    await dbRun(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        clinic_id INTEGER NOT NULL,
        clinic_name TEXT,
        patient_name TEXT,
        patient_email TEXT,
        patient_phone TEXT,
        patient_id_card TEXT,
        doctor_name TEXT,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        symptoms TEXT,
        status TEXT DEFAULT 'pending',
        appointment_type TEXT,
        source_request_id TEXT,
        doctor_selection_type TEXT,
        selected_specialty TEXT,
        selected_specialty_detail TEXT,
        selected_doctor TEXT,
        appointments_json JSONB DEFAULT '[]'::jsonb,
        attached_files_json JSONB DEFAULT '[]'::jsonb,
        relationship TEXT,
        gender TEXT,
        birth_date DATE,
        nationality TEXT,
        booking_payload JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // เพิ่มคอลัมน์ใหม่แบบปลอดภัยสำหรับฐานข้อมูลที่ถูกสร้างไว้แล้ว
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinic_name TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_name TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_phone TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_id_card TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source_request_id TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_selection_type TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS selected_specialty TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS selected_specialty_detail TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS selected_doctor TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointments_json JSONB DEFAULT '[]'::jsonb`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS attached_files_json JSONB DEFAULT '[]'::jsonb`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS relationship TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS gender TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS birth_date DATE`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS nationality TEXT`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_payload JSONB DEFAULT '{}'::jsonb`);
    await dbRun(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    console.log('Appointments table ready.');

    // Seed a default account on a fresh database so login works out-of-the-box.
    const row = await dbGet('SELECT COUNT(*) AS count FROM users');
    if (Number(row?.count) === 0) {
      const defaultPassword = await hashPassword('password123');
      await dbInsert(
        `INSERT INTO users (name, email, password, phone, id_card, date_of_birth, age, gender, height, weight, medical_conditions, allergies, role)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'patient')`,
        ['Test User', 'testuser1@gmail.com', defaultPassword, '0812345678', '1234567890123', '2000-01-01', 26, 'ชาย', 170, 65, '', '']
      );
      console.log('✅ Default user created: testuser1@gmail.com / password123');
    }

    // สร้างตาราง hospitals สำหรับจัดการโรงพยาบาล/คลินิกตาม API ใหม่
    await dbRun(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        logo TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Hospitals table ready.');

    // สร้างตาราง doctors สำหรับจัดการแพทย์
    await dbRun(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        specialty TEXT,
        phone TEXT,
        email TEXT,
        hospital_id INTEGER,
        hospital TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE SET NULL
      )
    `);
    await dbRun(`ALTER TABLE doctors DROP COLUMN IF EXISTS license_number`);
    await dbRun(`ALTER TABLE doctors DROP COLUMN IF EXISTS experience_years`);
    console.log('Doctors table ready.');
  } catch (err) {
    console.error('Database initialization error:', err);
    process.exit(1);
  }
}

/**
 * Middleware
 * ----------
 * โค้ดส่วนที่ใช้ทั้งระบบ (เช่น CORS, json body parser)
 */
app.use(cors());
app.use(express.json());
app.get('/api-docs.json', (req, res) => {
  res.json(openApiDocument);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  explorer: true,
  customSiteTitle: 'Health Queue API Docs',
}));
// รวมกลุ่ม API authentication ไว้ที่ /api/auth
app.use('/api/auth', createAuthRouter({ dbGet, dbInsert, jwtSecret: JWT_SECRET }));
// รองรับเส้นทางชุด user management และ admin users
app.use('/api/user', createUserRouter({ dbGet, dbAll, dbRun, jwtSecret: JWT_SECRET }));
// รวมกลุ่ม API hospitals ตามรูปตัวอย่าง
app.use('/api/hospitals', createHospitalsRouter({ dbGet, dbAll, dbRun, dbInsert }));
// รวมกลุ่ม API doctors ตามรูปตัวอย่าง
app.use('/api/doctors', createDoctorsRouter({ dbGet, dbAll, dbRun, dbInsert }));
// รวมกลุ่ม API appointments สำหรับการจองคิวและดึงรายการนัด
app.use('/api/appointments', createAppointmentsRouter({ dbAll, dbGet, dbInsert }));
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

app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Backend listening on http://localhost:${PORT}`);
});

