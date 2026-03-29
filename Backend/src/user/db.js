import pkg from 'pg';

const { Pool } = pkg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_tzvGTRZP2w1p@ep-gentle-river-a1y5lnep-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

// Convert SQLite-style ? placeholders to PostgreSQL $1, $2, ...
function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Returns a single row or null
export async function dbGet(sql, params = []) {
  const { rows } = await pool.query(convertPlaceholders(sql), params);
  return rows[0] ?? null;
}

// Returns all rows as an array
export async function dbAll(sql, params = []) {
  const { rows } = await pool.query(convertPlaceholders(sql), params);
  return rows;
}

// Executes a statement (UPDATE / DELETE / CREATE TABLE / etc.)
export async function dbRun(sql, params = []) {
  return pool.query(convertPlaceholders(sql), params);
}

// Executes an INSERT and returns the newly created row id
export async function dbInsert(sql, params = []) {
  const pgSql = `${convertPlaceholders(sql)} RETURNING id`;
  const { rows } = await pool.query(pgSql, params);
  return { lastID: rows[0]?.id };
}

export default pool;
