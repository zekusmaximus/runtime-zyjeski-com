// routes/auth.js - Example authentication routes
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import DatabaseManager from '../lib/database.js';
import { authLimiter } from '../lib/middleware/rate-limiter.js';
import { info, error } from '../lib/logger.js';

const router = express.Router();
const db = DatabaseManager.getInstance();

// Validation middleware
const registrationValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, and number'),
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be 2-50 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .notEmpty()
    .withMessage('Password required')
];

// Helper to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Registration endpoint with existing rate limiter
router.post('/register', 
  authLimiter, 
  registrationValidation,
  handleValidationErrors,
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
  loginValidation,
  handleValidationErrors,
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

export default router;