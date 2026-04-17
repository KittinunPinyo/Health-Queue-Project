import { dbAll } from './src/user/db.js';

(async () => {
  try {
    const rows = await dbAll('SELECT id,name,email,role FROM users ORDER BY id ASC');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('DB query failed:', err);
  }
})();
