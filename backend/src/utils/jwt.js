const jwt = require('jsonwebtoken');
const crypto = require('crypto');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production');
}

const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
