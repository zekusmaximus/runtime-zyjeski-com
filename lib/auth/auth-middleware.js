import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import DatabaseManager from '../database.js';
import { info, warn, error } from '../logger.js';

const db = DatabaseManager.getInstance();
const verifyJWT = promisify(jwt.verify);

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        timestamp: new Date().toISOString()
      });
    }

    const decoded = await verifyJWT(token, process.env.JWT_ACCESS_SECRET);

    const tokenRecord = db.getToken(decoded.jti);
    if (!tokenRecord || tokenRecord.revoked) {
      warn('Token not found in database or revoked', {
        jti: decoded.jti,
        userId: decoded.userId,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        error: 'Token revoked or invalid',
        timestamp: new Date().toISOString()
      });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      tokenId: decoded.jti,
      sessionId: decoded.sessionId || tokenRecord.session_id
    };

    next();
  } catch (err) {
    error('Authentication failed', {
      error: err.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = await verifyJWT(token, process.env.JWT_ACCESS_SECRET);
    const tokenRecord = db.getToken(decoded.jti);

    if (tokenRecord && !tokenRecord.revoked) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        tokenId: decoded.jti,
        sessionId: decoded.sessionId || tokenRecord.session_id
      };
    } else {
      req.user = null;
    }

    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

export function requireDebuggingStateOwnership(req, res, next) {
  const stateId = req.params.stateId || req.body.stateId;

  if (!stateId) {
    return res.status(400).json({
      success: false,
      error: 'Debugging state ID required',
      timestamp: new Date().toISOString()
    });
  }

  const debuggingState = db.getDebuggingState(stateId);

  if (!debuggingState) {
    return res.status(404).json({
      success: false,
      error: 'Debugging state not found',
      timestamp: new Date().toISOString()
    });
  }

  if (debuggingState.user_id !== req.user.id) {
    warn('Unauthorized debugging state access attempt', {
      userId: req.user.id,
      stateId: stateId,
      ownerId: debuggingState.user_id,
      ip: req.ip
    });

    return res.status(403).json({
      success: false,
      error: 'Access denied',
      timestamp: new Date().toISOString()
    });
  }

  req.debuggingState = debuggingState;
  next();
}
