import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * JWT Authentication Middleware
 *
 * Verifies Bearer JWT from Authorization header and attaches decoded
 * user payload to req.user.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access denied. Authorization header is missing.',
    });
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Malformed authorization token. Expected format: "Bearer <token>".',
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    return next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: isExpired ? 'Authentication token has expired. Please log in again.' : 'Invalid authentication token.',
    });
  }
}

/**
 * Optional JWT Authentication Middleware
 * If Authorization header or token query is provided, decodes and attaches req.user.
 * Does not block unauthenticated requests.
 */
export function authenticateOptionalToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    } catch {
      // Ignore invalid optional tokens
    }
  }

  return next();
}

export default authenticateToken;

