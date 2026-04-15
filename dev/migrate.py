import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # If it's the db.ts file, entirely rewrite it for pg
    if filepath.endswith('lib/db.ts'):
        # Postgres driver initialization
        new_db_ts = """import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
"""
        with open(filepath, 'w') as f:
            f.write(new_db_ts)
        return

    original = content
    # Replace imports
    content = re.sub(r'import \{ getDb \}.*?;', 'import { query, queryOne, execute } from "@/lib/db";', content)
    # Some paths might be relative (e.g. "../../../lib/db"), replace all getDb imports safely:
    content = re.sub(r'import\s+\{\s*getDb\s*\}\s+from\s+[\'"](?:.*/)*db[\'"];?', 'import { query, queryOne, execute } from "' + os.path.relpath('src/lib/db', os.path.dirname(filepath)).replace("\\", "/") + '";', content)
    
    # Remove `const db = getDb();`
    content = re.sub(r'^\s*(?:const|let)\s+db\s*=\s*getDb\(\)\s*;\s*\n', '', content, flags=re.MULTILINE)
    
    # Replace db.prepare(Q).all(A) -> await query(Q, A)
    # This requires careful regex
    # Match: db.prepare( arg1 ).all( arg2 )
    
    # Let's do string replacement for `.all()`
    content = re.sub(r'db\s*\.\s*prepare\s*\(\s*(.*?)\s*\)\s*\.\s*all\s*\((.*?)\)', r'await query(\1, [\2])', content, flags=re.DOTALL)
    
    # For .get()
    content = re.sub(r'db\s*\.\s*prepare\s*\(\s*(.*?)\s*\)\s*\.\s*get\s*\((.*?)\)', r'await queryOne(\1, [\2])', content, flags=re.DOTALL)
    
    # For .run()
    content = re.sub(r'db\s*\.\s*prepare\s*\(\s*(.*?)\s*\)\s*\.\s*run\s*\((.*?)\)', r'await execute(\1, [\2])', content, flags=re.DOTALL)

    # Some .all() or .get() or .run() might not have arguments
    content = re.sub(r'db\s*\.\s*prepare\s*\(\s*(.*?)\s*\)\s*\.\s*all\s*\(\s*\)', r'await query(\1)', content, flags=re.DOTALL)
    content = re.sub(r'db\s*\.\s*prepare\s*\(\s*(.*?)\s*\)\s*\.\s*get\s*\(\s*\)', r'await queryOne(\1)', content, flags=re.DOTALL)
    content = re.sub(r'db\s*\.\s*prepare\s*\(\s*(.*?)\s*\)\s*\.\s*run\s*\(\s*\)', r'await execute(\1)', content, flags=re.DOTALL)

    # Convert sync function declarations to async if we injected an await
    if 'await query' in content or 'await execute' in content:
        # Check if computeGroupBalances is now async
        content = re.sub(r'export function computeGroupBalances', 'export async function computeGroupBalances', content)
        content = re.sub(r'export function computeGroupStats', 'export async function computeGroupStats', content)
        content = re.sub(r'function isMember', 'async function isMember', content)
        
        # Adding await to computeGroupBalances calls
        content = re.sub(r'computeGroupBalances\(', 'await computeGroupBalances(', content)
        content = re.sub(r'computeGroupStats\(', 'await computeGroupStats(', content)
        content = re.sub(r'isMember\(', 'await isMember(', content)

    # Write back if changed
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.js'):
            process_file(os.path.join(root, file))
