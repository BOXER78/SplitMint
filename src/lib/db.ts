import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? undefined : { rejectUnauthorized: false }
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
