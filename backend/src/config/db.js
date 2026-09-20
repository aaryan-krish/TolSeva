const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'tolseva';
let client;
let db;

async function connect() {
  if (db) return db;
  if (!mongoUri || mongoUri.includes('<cluster>')) {
    throw new Error('MONGODB_URI is missing or still contains the <cluster> placeholder');
  }

  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(databaseName);
  return db;
}

async function testConnection() {
  const connectedDb = await connect();
  await connectedDb.command({ ping: 1 });
  console.log(`MongoDB connected successfully: ${connectedDb.databaseName}`);
  return connectedDb;
}

function getDb() {
  if (!db) {
    throw new Error('MongoDB is not connected. Call testConnection() before using the database.');
  }
  return db;
}

async function close() {
  if (client) await client.close();
  client = undefined;
  db = undefined;
}

function isMongoAvailable() {
  return Boolean(db);
}

async function query(text, params = []) {
  const database = getDb();
  const normalized = text.replace(/\s+/g, ' ').trim();

  let collectionName;
  if (normalized.includes('vendors')) collectionName = 'vendors';
  if (normalized.includes('inspectors')) collectionName = 'inspectors';
  if (normalized.includes('admins')) collectionName = 'admins';
  if (!collectionName) throw new Error(`Unsupported database query: ${normalized}`);

  const collection = database.collection(collectionName);

  if (normalized.startsWith('SELECT')) {
    if (normalized.includes('WHERE (') && normalized.includes(' OR phone = $1')) {
      const user = await collection.findOne({
        $or: [{ gov_id: params[0] }, { username: params[0] }, { phone: params[0] }]
      });
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    const field = normalized.includes('gov_id = $1')
      ? 'gov_id'
      : normalized.includes('username = $1')
        ? 'username'
        : 'gstin';
    const user = await collection.findOne({ [field]: params[0] });
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (normalized.startsWith('UPDATE')) {
    const updates = {};
    if (normalized.includes('password_hash = $1')) updates.password_hash = params[0];
    if (normalized.includes('otp = $1')) updates.otp = params[0];
    if (normalized.includes('otp_expires_at = $2')) updates.otp_expires_at = params[1];
    if (normalized.includes('is_verified = TRUE')) updates.is_verified = true;
    if (normalized.includes('otp = NULL')) updates.otp = null;
    if (normalized.includes('otp_expires_at = NULL')) updates.otp_expires_at = null;

    const id = params[normalized.includes('password_hash = $1') ? 1 : normalized.includes('otp = $1') ? 2 : 0];
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: { ...updates, updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    const updated = result?.value || result;
    return { rows: updated ? [updated] : [], rowCount: updated ? 1 : 0 };
  }

  throw new Error(`Unsupported database query: ${normalized}`);
}

module.exports = {
  close,
  getDb,
  isMongoAvailable,
  pool: null,
  query,
  testConnection
};
