const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
  } catch (err) {
    console.error('\n❌ [TolSeva Startup Error]: MongoDB connection failed:', err.message);
    console.error('💡 Set MONGODB_URI, MONGODB_DB, JWT_SECRET, and Atlas Network Access in Render.\n');
    process.exitCode = 1;
    return;
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
