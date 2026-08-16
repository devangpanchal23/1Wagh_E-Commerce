const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'wagh_google_drive_token_enc_key_32bytes!';

function getDerivedKey() {
  return crypto.createHash('sha256').update(SECRET_KEY).digest();
}

function encryptToken(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getDerivedKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptToken(encryptedData) {
  if (!encryptedData || !encryptedData.includes(':')) return '';
  const [ivHex, cipherHex] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getDerivedKey(), iv);
  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  encryptToken,
  decryptToken,
};
