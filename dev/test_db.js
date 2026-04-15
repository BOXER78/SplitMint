const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const res = await pool.query('SELECT current_user, current_database();');
    console.log("Connection successful:", res.rows);
    
    // Check if users table exists
    const tableRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    console.log("Users table exists:", tableRes.rows[0].exists);
  } catch (err) {
    console.error("Database connection/query error:", err.message);
  } finally {
    pool.end();
  }
}

test();
