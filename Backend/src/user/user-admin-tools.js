import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';

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

const db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    console.error('DB open error', err);
    process.exit(1);
  }
});

function closeAndExit(code = 0) {
  db.close(() => process.exit(code));
}

if (action === 'list-users') {
  // แสดงผู้ใช้ทั้งหมดแบบตารางเพื่อใช้ตรวจสอบข้อมูล
  db.all('SELECT id, name, email, id_card, role FROM users', (err, rows) => {
    if (err) {
      console.error('Query error', err);
      closeAndExit(1);
      return;
    }
    console.table(rows);
    closeAndExit(0);
  });
} else if (action === 'reset-password') {
  // รีเซ็ตรหัสผ่านตาม email โดย hash ก่อนอัปเดตเสมอ
  const email = process.argv[3];
  const newPassword = process.argv[4] || 'password123';

  if (!email) {
    console.error('Usage: node src/user/user-admin-tools.js reset-password <email> [newPassword]');
    closeAndExit(1);
  } else {
    bcrypt.hash(newPassword, 10, (hashErr, hash) => {
      if (hashErr) {
        console.error('Hash error', hashErr);
        closeAndExit(1);
        return;
      }

      db.run('UPDATE users SET password = ? WHERE email = ?', [hash, email], function onUpdate(updateErr) {
        if (updateErr) {
          console.error('Update error', updateErr);
          closeAndExit(1);
          return;
        }

        if (this.changes === 0) {
          console.error('No user found with email', email);
          closeAndExit(1);
          return;
        }

        console.log('Password updated for', email);
        closeAndExit(0);
      });
    });
  }
} else if (action === 'promote-admin') {
  const email = process.argv[3];

  if (!email) {
    console.error('Usage: node src/user/user-admin-tools.js promote-admin <email>');
    closeAndExit(1);
  } else {
    db.run('UPDATE users SET role = ? WHERE email = ?', ['admin', email], function onUpdate(updateErr) {
      if (updateErr) {
        console.error('Update error', updateErr);
        closeAndExit(1);
        return;
      }

      if (this.changes === 0) {
        console.error('No user found with email', email);
        closeAndExit(1);
        return;
      }

      console.log('User promoted to admin for', email);
      closeAndExit(0);
    });
  }
} else {
  console.error('Unknown action:', action);
  printUsage();
  closeAndExit(1);
}
