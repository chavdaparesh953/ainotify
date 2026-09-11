import config from '../config/env.js';

/**
 * Global Error Handler Middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, {
    status: statusCode,
    message,
    stack: config.env === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Route Not Found Middleware
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export default {
  errorHandler,
  notFoundHandler,
};
