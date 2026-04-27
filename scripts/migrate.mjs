import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'BUyQAzYqVVr19M4i';
const REF      = 'yqgafvblxxyksximctzk';

const sql = readFileSync(
  join(__dirname, '../supabase/migrations/001_clinic_schema.sql'),
  'utf-8'
);

const configs = [
  { host: `db.${REF}.supabase.co`,                 port: 5432, user: 'postgres' },
  { host: 'aws-0-us-east-1.pooler.supabase.com',  port: 5432, user: `postgres.${REF}` },
  { host: 'aws-0-us-east-1.pooler.supabase.com',  port: 6543, user: `postgres.${REF}` },
  { host: 'aws-0-sa-east-1.pooler.supabase.com',  port: 5432, user: `postgres.${REF}` },
];

let client = null;
for (const cfg of configs) {
  try {
    const c = new Client({ ...cfg, password: PASSWORD, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    await c.connect();
    console.log(`✓ Conectado via ${cfg.host}:${cfg.port}`);
    client = c;
    break;
  } catch (e) {
    console.log(`✗ ${cfg.host}:${cfg.port} — ${e.message}`);
  }
}

if (!client) {
  console.error('\nNão foi possível conectar. Verifique sua conexão com a internet.');
  process.exit(1);
}

try {
  await client.query(sql);
  console.log('\n✓ Migration aplicada com sucesso!\n');

  const { rows } = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  console.log('Tabelas no banco:');
  rows.forEach(r => console.log(' •', r.tablename));
} catch (err) {
  console.error('✗ Erro ao executar migration:', err.message);
} finally {
  await client.end();
}
