import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import config from '../config/env.js';

/**
 * Generate signed JWT token for authenticated user
 * @param {Object} user
 * @returns {string} JWT Token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Register a new merchant user
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { email, password } = req.body || {};

    // 1. Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A valid email address is required.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Password is required and must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    }

    // 3. Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Persist User in PostgreSQL via Prisma
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        subscriptionStatus: 'TRIAL',
      },
    });

    // 5. Issue JWT Token
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth Register Error]', error);
    next(error);
  }
}

/**
 * Login existing merchant user
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // 3. Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // 4. Issue JWT Token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth Login Error]', error);
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        isOnboarded: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[Auth GetMe Error]', error);
    next(error);
  }
}

/**
 * Mark merchant onboarding as completed
 * POST /api/auth/complete-onboarding
 */
export async function completeOnboarding(req, res, next) {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { isOnboarded: true },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        isOnboarded: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Onboarding marked as completed successfully.',
      user,
    });
  } catch (error) {
    console.error('[Auth CompleteOnboarding Error]', error);
    next(error);
  }
}

/**
 * Request Password Reset Link
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A valid email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Anti-enumeration: Return success response even if user not found
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate secure 1-hour signed JWT reset token
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'PASSWORD_RESET',
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Resolve client origin dynamically
    let clientOrigin = config.appUrl;
    if (req.headers.origin) {
      clientOrigin = req.headers.origin;
    } else if (req.headers.referer) {
      try {
        clientOrigin = new URL(req.headers.referer).origin;
      } catch (_) {}
    }

    const resetUrl = `${clientOrigin}/reset-password?token=${encodeURIComponent(resetToken)}`;

    // Import email dispatcher dynamically
    const { sendPasswordResetEmail } = await import('../services/emailService.js');
    const emailResult = await sendPasswordResetEmail({
      toEmail: user.email,
      resetUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      // In development or mock mode, provide resetUrl for effortless local testing
      ...(emailResult?.isMock || config.env === 'development' ? { resetUrl } : {}),
    });
  } catch (error) {
    console.error('[Auth ForgotPassword Error]', error);
    next(error);
  }
}

/**
 * Complete Password Reset
 * POST /api/auth/reset-password
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Reset token is required.',
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'New password must be at least 6 characters long.',
      });
    }

    // Verify cryptographic signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'InvalidToken',
        message: 'Password reset link is invalid or has expired. Please request a new one.',
      });
    }

    if (decoded.type !== 'PASSWORD_RESET' || !decoded.userId) {
      return res.status(400).json({
        success: false,
        error: 'InvalidToken',
        message: 'Invalid reset token payload.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'Merchant user account not found.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    console.log(`[Auth] 🔑 Password reset successfully completed for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('[Auth ResetPassword Error]', error);
    next(error);
  }
}

export default {
  register,
  login,
  getMe,
  completeOnboarding,
  forgotPassword,
  resetPassword,
};
