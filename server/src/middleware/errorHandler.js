const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for field '${field}'. Please use another value.`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Multer errors (bad field name, size limit) and its fileFilter rejections
  // otherwise surface as an opaque 500 — give them a clear 400 + message here
  // so every upload route gets this for free instead of handling it locally.
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum size is 5MB.'
      : err.message;
  } else if (statusCode === 500 && /invalid file type/i.test(message)) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message: message
  });
};

module.exports = errorHandler;
