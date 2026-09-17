const { Pool } = require('pg');

const isRemoteHost = process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST);
const useSSL = process.env.DB_SSL === 'true' || isRemoteHost || !!process.env.DATABASE_URL;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'tolseva_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    };

let pool = null;
let isPgAvailable = false;

try {
  pool = new Pool(poolConfig);
  pool.on('error', (err) => {
    console.warn('⚠️ [PostgreSQL Pool Warning]:', err.message);
  });
} catch (e) {
  console.warn('⚠️ Could not initialize pg pool:', e.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY FALLBACK DATABASE (Active when PostgreSQL is offline)
// ─────────────────────────────────────────────────────────────────────────────
