import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_tzvGTRZP2w1p@ep-gentle-river-a1y5lnep-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// รับคำสั่งจาก terminal เช่น list-users หรือ reset-password
const action = process.argv[2];

function printUsage() {
  console.log('Usage:');
  console.log('  node src/user/user-admin-tools.js list-users');
  console.log('  node src/user/user-admin-tools.js reset-password <email> [newPassword]');
  console.log('  node src/user/user-admin-tools.js promote-admin <email>');
}

if (!action) {
  printUsage();
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function closeAndExit(code = 0) {
  await pool.end();
  process.exit(code);
}

if (action === 'list-users') {
  // แสดงผู้ใช้ทั้งหมดแบบตารางเพื่อใช้ตรวจสอบข้อมูล
  try {
    const { rows } = await pool.query('SELECT id, name, email, id_card, role FROM users');
    console.table(rows);
    await closeAndExit(0);
  } catch (err) {
    console.error('Query error', err);
    await closeAndExit(1);
  }
} else if (action === 'reset-password') {
  // รีเซ็ตรหัสผ่านตาม email โดย hash ก่อนอัปเดตเสมอ
  const email = process.argv[3];
  const newPassword = process.argv[4] || 'password123';

  if (!email) {
    console.error('Usage: node src/user/user-admin-tools.js reset-password <email> [newPassword]');
    await closeAndExit(1);
  } else {
    try {
      const hash = await bcrypt.hash(newPassword, 10);
      const result = await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, email]);
      if (result.rowCount === 0) {
        console.error('No user found with email', email);
        await closeAndExit(1);
      } else {
        console.log('Password updated for', email);
        await closeAndExit(0);
      }
    } catch (err) {
      console.error('Error:', err);
      await closeAndExit(1);
    }
  }
} else if (action === 'promote-admin') {
  const email = process.argv[3];

  if (!email) {
    console.error('Usage: node src/user/user-admin-tools.js promote-admin <email>');
    await closeAndExit(1);
  } else {
    try {
      const result = await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email]);
      if (result.rowCount === 0) {
        console.error('No user found with email', email);
        await closeAndExit(1);
      } else {
        console.log('User promoted to admin for', email);
        await closeAndExit(0);
      }
    } catch (err) {
      console.error('Error:', err);
      await closeAndExit(1);
    }
  }
} else {
  console.error('Unknown action:', action);
  printUsage();
  await closeAndExit(1);
}