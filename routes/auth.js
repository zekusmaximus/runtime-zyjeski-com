// routes/auth.js - Example authentication routes
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import DatabaseManager from '../lib/database.js';
import { authLimiter } from '../lib/middleware/rate-limiter.js';
import { info, error } from '../lib/logger.js';
import { authenticateToken } from '../lib/auth/auth-middleware.js';
import { validateRegistration, validateLogin } from '../lib/validation/auth-validation.js';

const router = express.Router();
const db = DatabaseManager.getInstance();

// Validation middleware is now imported from lib/validation/auth-validation.js

// Registration endpoint with existing rate limiter
router.post('/register',
  authLimiter,
  validateRegistration,
  async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      
      // Check if user exists
      const existingUser = db.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
      
      // Create user
      const result = db.createUser({ email, passwordHash, displayName });
      
      // Log security event
      db.logSecurityEvent({
        userId: result.lastInsertRowid,
        eventType: 'registration',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { email }
      });
      
      info('User registered', { userId: result.lastInsertRowid, email });
      
      res.status(201).json({ 
        message: 'Registration successful',
        userId: result.lastInsertRowid 
      });
    } catch (err) {
      error('Registration failed', { error: err.message });
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login endpoint with existing rate limiter
router.post('/login',
  authLimiter,
  validateLogin,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Get user
      const user = db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return res.status(423).json({ 
          error: 'Account locked',
          lockedUntil: user.locked_until 
        });
      }
      
      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        // Update failed login attempts
        db.updateLoginInfo(user.id, false);
        
        // Log security event
        db.logSecurityEvent({
          userId: user.id,
          eventType: 'failed_login',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { email }
        });
        
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate session ID and tokens
      const sessionId = crypto.randomUUID();
      const accessTokenId = crypto.randomUUID();
      const refreshTokenId = crypto.randomUUID();
      
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          jti: accessTokenId,
          sessionId 
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const refreshToken = jwt.sign(
        { 
          userId: user.id,
          jti: refreshTokenId,
          sessionId 
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      
      // Store tokens in database
      const accessExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      db.storeToken({
        id: accessTokenId,
        userId: user.id,
        tokenType: 'access',
        sessionId,
        expiresAt: accessExpiry.toISOString()
      });
      
      db.storeToken({
        id: refreshTokenId,
        userId: user.id,
        tokenType: 'refresh',
        sessionId,
        expiresAt: refreshExpiry.toISOString()
      });
      
      // Update login info
      db.updateLoginInfo(user.id, true);
      
      // Log security event
      db.logSecurityEvent({
        userId: user.id,
        eventType: 'successful_login',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { email, sessionId }
      });
      
      info('User logged in', { userId: user.id, email });
      
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name
        }
      });
    } catch (err) {
      error('Login failed', { error: err.message });
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

function rotateTokensForSession(user, existingSessionId, db) {
  const accessTokenId = crypto.randomUUID();
  const refreshTokenId = crypto.randomUUID();

  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      jti: accessTokenId,
      sessionId: existingSessionId
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      jti: refreshTokenId,
      sessionId: existingSessionId
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  const accessExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  db.storeToken({
    id: accessTokenId,
    userId: user.id,
    tokenType: 'access',
    sessionId: existingSessionId,
    expiresAt: accessExpiresAt.toISOString()
  });

  db.storeToken({
    id: refreshTokenId,
    userId: user.id,
    tokenType: 'refresh',
    sessionId: existingSessionId,
    expiresAt: refreshExpiresAt.toISOString()
  });

  return { accessToken, refreshToken };
}

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
        timestamp: new Date().toISOString()
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokenRecord = db.getToken(decoded.jti);
    if (!tokenRecord || tokenRecord.token_type !== 'refresh' || tokenRecord.revoked) {
      return res.status(403).json({
        success: false,
        error: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      });
    }

    const user = db.getUserById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'User not found or inactive',
        timestamp: new Date().toISOString()
      });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        error: 'Account locked',
        lockedUntil: user.locked_until,
        timestamp: new Date().toISOString()
      });
    }

    const existingSessionId = tokenRecord.session_id;
    db.revokeToken(decoded.jti);

    const tokens = rotateTokensForSession(user, existingSessionId, db);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    error('Token refresh error', { error: err.message });
    res.status(403).json({
      success: false,
      error: 'Invalid refresh token',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    db.revokeAuthSession(req.user.sessionId);

    db.logSecurityEvent({
      userId: req.user.id,
      eventType: 'logout',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: JSON.stringify({ sessionId: req.user.sessionId })
    });

    info('User logged out', { userId: req.user.id });

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    error('Logout error', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    db.revokeUserTokens(req.user.id);

    db.logSecurityEvent({
      userId: req.user.id,
      eventType: 'logout_all_devices',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: JSON.stringify({})
    });

    info('User logged out from all devices', { userId: req.user.id });

    res.json({
      success: true,
      data: { message: 'Logged out from all devices' },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    error('Logout all error', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email
      }
    },
    timestamp: new Date().toISOString()
  });
});

export default router;