require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
  } catch (err) {
    console.warn('\n⚠️ [TolSeva DB Notice]: PostgreSQL connection failed:', err.message);
    console.warn('💡 Ensure PostgreSQL is running and "tolseva_db" is created using migrations/001_init_schema.sql');
    console.warn('🚀 Starting HTTP server anyway for health checks and API routes...\n');
  }

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   TolSeva Backend Server                     ║
║   Running on: http://localhost:${PORT}          ║
║   Environment: ${process.env.NODE_ENV || 'development'}            ║
╚══════════════════════════════════════════════╝
    `);
  });
}

startServer();
