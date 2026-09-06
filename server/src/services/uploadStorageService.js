const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

class LocalStoragePermissionError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'LocalStoragePermissionError';
    this.code = 'LOCAL_STORAGE_PERMISSION_ERROR';
    this.cause = cause;
    this.nodeCode = cause?.code;
  }
}

// A disk-backed multer upload otherwise fails only after the admin has selected
// a file. Verify the directory at boot instead, including an actual write.
function ensureUploadsDirectoryWritable() {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const probe = path.join(UPLOADS_DIR, `.write-probe-${process.pid}-${crypto.randomUUID()}`);
    fs.writeFileSync(probe, 'ok', { flag: 'wx' });
    fs.unlinkSync(probe);
    return UPLOADS_DIR;
  } catch (error) {
    throw new LocalStoragePermissionError(
      `Upload storage is not writable at ${UPLOADS_DIR} (Node ${error.code || 'UNKNOWN'}: ${error.message})`,
      error
    );
  }
}

function isFilesystemPermissionError(error) {
  return error?.code === 'LOCAL_STORAGE_PERMISSION_ERROR' ||
    ['EACCES', 'EPERM', 'EROFS'].includes(error?.code);
}

module.exports = {
  UPLOADS_DIR,
  LocalStoragePermissionError,
  ensureUploadsDirectoryWritable,
  isFilesystemPermissionError,
};
