const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
  } catch (err) {
    console.warn('\n⚠️ [TolSeva DB Notice]: MongoDB connection failed:', err.message);
    console.warn('💡 Ensure MONGODB_URI is configured with a reachable MongoDB Atlas cluster');
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
