import { Pool, types } from 'pg';

// Force numeric types to be parsed as numbers instead of strings
// 20 = int8, 701 = float8, 1700 = numeric/decimal
types.setTypeParser(20, val => parseInt(val, 10));
types.setTypeParser(701, val => parseFloat(val));
types.setTypeParser(1700, val => parseFloat(val));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000, // Stop waiting after 5 seconds
});

export async function query(text: string, params: any[] = []) {
  // Convert ? to $1, $2, etc for postgres
  let i = 1;
  const pgText = text.replace(/\?/g, () => `$${i++}`);
  
  const client = await pool.connect();
  try {
    const res = await client.query(pgText, params);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function queryOne(text: string, params: any[] = []) {
  const rows = await query(text, params);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function execute(text: string, params: any[] = []) {
  let i = 1;
  const pgText = text.replace(/\?/g, () => `$${i++}`);
  const client = await pool.connect();
  try {
    const res = await client.query(pgText, params);
    return res;
  } finally {
    client.release();
  }
}
