// lib/database.js - Database Schema & Implementation for Authentication System
// ESM-compliant module for runtime.zyjeski.com

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { info, error, warn } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration Constants
const AUTH_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  TOKEN_AUDIT_RETENTION_DAYS: 30,
  SESSION_EXPIRY_HOURS: 24
};

// Database Schema (SQLite)
const CREATE_TABLES = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  login_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME NULL
);

-- Debugging session states
CREATE TABLE IF NOT EXISTS debugging_states (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  consciousness_state TEXT, -- JSON blob of consciousness debugging state
  terminal_history TEXT, -- JSON array of command history
  breakpoints TEXT, -- JSON array of active breakpoints
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Authentication tokens with session linking and audit trail
CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY, -- JWT ID (jti claim)
  user_id INTEGER NOT NULL,
  session_id TEXT NOT NULL, -- Links access and refresh tokens for single device
  token_type TEXT NOT NULL CHECK (token_type IN ('access', 'refresh')),
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at DATETIME NULL, -- For audit trail
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Security audit log
CREATE TABLE IF NOT EXISTS security_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details TEXT, -- JSON blob
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_session ON auth_tokens(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_revoked ON auth_tokens(revoked, revoked_at);
CREATE INDEX IF NOT EXISTS idx_debugging_states_user_char ON debugging_states(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_debugging_states_expires ON debugging_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_log_user_event ON security_log(user_id, event_type);
`;

class DatabaseManager {
  constructor() {
    if (DatabaseManager.instance) {
      return DatabaseManager.instance;
    }
    
    this.db = null;
    this.config = AUTH_CONFIG;
    this.init();
    DatabaseManager.instance = this;
  }

  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  init() {
    try {
      // Ensure data directory exists
      const dataDir = path.join(__dirname, '../data');
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      
      const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'runtime.db');
      this.db = new Database(dbPath);
      
      // Enable foreign keys and WAL mode for better concurrent access
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');
      
      // Create tables
      this.db.exec(CREATE_TABLES);
      
      info('Database initialized successfully', { path: dbPath });
    } catch (err) {
      error('Database initialization failed', { error: err.message });
      throw err;
    }
  }

  // User management methods (synchronous)
  createUser(userData) {
    const { email, passwordHash, displayName } = userData;
    const stmt = this.db.prepare(`
      INSERT INTO users (email, password_hash, display_name) 
      VALUES (?, ?, ?)
    `);
    return stmt.run(email, passwordHash, displayName);
  }

  getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  updateLoginInfo(userId, success = true) {
    if (success) {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP, 
            login_count = login_count + 1,
            failed_login_attempts = 0,
            locked_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      return stmt.run(userId);
    } else {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE 
              WHEN failed_login_attempts >= ? 
              THEN datetime('now', '+${this.config.LOCKOUT_DURATION_MINUTES} minutes')
              ELSE locked_until
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      return stmt.run(this.config.MAX_FAILED_ATTEMPTS - 1, userId);
    }
  }

  // Debugging state management
  createDebuggingState(stateData) {
    const { id, userId, characterId, consciousnessState, terminalHistory, breakpoints, expiresAt } = stateData;
    const stmt = this.db.prepare(`
      INSERT INTO debugging_states 
      (id, user_id, character_id, consciousness_state, terminal_history, breakpoints, expires_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      id,
      userId,
      characterId,
      JSON.stringify(consciousnessState || {}),
      JSON.stringify(terminalHistory || []),
      JSON.stringify(breakpoints || []),
      expiresAt
    );
  }

  getDebuggingState(stateId) {
    const stmt = this.db.prepare(`
      SELECT * FROM debugging_states 
      WHERE id = ? AND expires_at > CURRENT_TIMESTAMP
    `);
    const state = stmt.get(stateId);
    if (state) {
      // Parse JSON fields
      try {
        state.consciousness_state = JSON.parse(state.consciousness_state || '{}');
        state.terminal_history = JSON.parse(state.terminal_history || '[]');
        state.breakpoints = JSON.parse(state.breakpoints || '[]');
      } catch (parseError) {
        warn('Failed to parse debugging state data', { stateId, error: parseError.message });
        // Provide empty defaults if parsing fails
        state.consciousness_state = {};
        state.terminal_history = [];
        state.breakpoints = [];
      }
    }
    return state;
  }

  updateDebuggingState(stateId, updateData) {
    const { consciousnessState, terminalHistory, breakpoints } = updateData;
    const stmt = this.db.prepare(`
      UPDATE debugging_states 
      SET consciousness_state = ?,
          terminal_history = ?,
          breakpoints = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      JSON.stringify(consciousnessState || {}),
      JSON.stringify(terminalHistory || []),
      JSON.stringify(breakpoints || []),
      stateId
    );
  }

  deleteDebuggingState(stateId) {
    const stmt = this.db.prepare('DELETE FROM debugging_states WHERE id = ?');
    return stmt.run(stateId);
  }

  getUserDebuggingStates(userId, characterId = null) {
    let stmt;
    if (characterId) {
      stmt = this.db.prepare(`
        SELECT * FROM debugging_states 
        WHERE user_id = ? AND character_id = ? AND expires_at > CURRENT_TIMESTAMP
      `);
      return stmt.all(userId, characterId);
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM debugging_states 
        WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
      `);
      return stmt.all(userId);
    }
  }

  // Authentication session token management
  storeToken(tokenData) {
    const { id, userId, tokenType, sessionId, expiresAt } = tokenData;
    const stmt = this.db.prepare(`
      INSERT INTO auth_tokens (id, user_id, token_type, session_id, expires_at) 
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(id, userId, tokenType, sessionId, expiresAt);
  }

  getToken(tokenId) {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_tokens 
      WHERE id = ? AND expires_at > CURRENT_TIMESTAMP AND revoked = FALSE
    `);
    return stmt.get(tokenId);
  }

  revokeToken(tokenId, auditTrail = true) {
    if (auditTrail) {
      // Mark as revoked with timestamp for audit trail
      const stmt = this.db.prepare(`
        UPDATE auth_tokens 
        SET revoked = TRUE, revoked_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      return stmt.run(tokenId);
    } else {
      // Immediate deletion (for cleanup operations)
      const stmt = this.db.prepare('DELETE FROM auth_tokens WHERE id = ?');
      return stmt.run(tokenId);
    }
  }

  revokeAuthSession(sessionId, auditTrail = true) {
    if (auditTrail) {
      const stmt = this.db.prepare(`
        UPDATE auth_tokens 
        SET revoked = TRUE, revoked_at = CURRENT_TIMESTAMP 
        WHERE session_id = ?
      `);
      return stmt.run(sessionId);
    } else {
      const stmt = this.db.prepare('DELETE FROM auth_tokens WHERE session_id = ?');
      return stmt.run(sessionId);
    }
  }

  revokeUserTokens(userId, tokenType = null, auditTrail = true) {
    let stmt;
    if (auditTrail) {
      if (tokenType) {
        stmt = this.db.prepare(`
          UPDATE auth_tokens 
          SET revoked = TRUE, revoked_at = CURRENT_TIMESTAMP 
          WHERE user_id = ? AND token_type = ?
        `);
        return stmt.run(userId, tokenType);
      } else {
        stmt = this.db.prepare(`
          UPDATE auth_tokens 
          SET revoked = TRUE, revoked_at = CURRENT_TIMESTAMP 
          WHERE user_id = ?
        `);
        return stmt.run(userId);
      }
    } else {
      if (tokenType) {
        stmt = this.db.prepare('DELETE FROM auth_tokens WHERE user_id = ? AND token_type = ?');
        return stmt.run(userId, tokenType);
      } else {
        stmt = this.db.prepare('DELETE FROM auth_tokens WHERE user_id = ?');
        return stmt.run(userId);
      }
    }
  }

  getAuthSessionTokens(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM auth_tokens 
      WHERE session_id = ? AND revoked = FALSE AND expires_at > CURRENT_TIMESTAMP
    `);
    return stmt.all(sessionId);
  }

  // Security logging
  logSecurityEvent(eventData) {
    const { userId, eventType, ipAddress, userAgent, details } = eventData;
    const stmt = this.db.prepare(`
      INSERT INTO security_log (user_id, event_type, ip_address, user_agent, details) 
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(userId, eventType, ipAddress, userAgent, JSON.stringify(details || {}));
  }

  // Cleanup expired data (user-triggered only)
  cleanupExpiredData() {
    info('Starting database cleanup (user-triggered)');
    
    // Clean up expired debugging states
    const stateCleanup = this.db.prepare('DELETE FROM debugging_states WHERE expires_at <= CURRENT_TIMESTAMP');
    
    // Clean up expired tokens (immediate deletion)
    const expiredTokenCleanup = this.db.prepare('DELETE FROM auth_tokens WHERE expires_at <= CURRENT_TIMESTAMP');
    
    // Clean up old revoked tokens (audit trail cleanup)
    const revokedTokenCleanup = this.db.prepare(`
      DELETE FROM auth_tokens 
      WHERE revoked = TRUE 
      AND revoked_at <= datetime('now', '-${this.config.TOKEN_AUDIT_RETENTION_DAYS} days')
    `);
    
    const stateResult = stateCleanup.run();
    const expiredTokenResult = expiredTokenCleanup.run();
    const revokedTokenResult = revokedTokenCleanup.run();
    
    info('Database cleanup completed', {
      expiredDebuggingStates: stateResult.changes,
      expiredTokens: expiredTokenResult.changes,
      oldRevokedTokens: revokedTokenResult.changes
    });
    
    return {
      expiredDebuggingStates: stateResult.changes,
      expiredTokens: expiredTokenResult.changes,
      oldRevokedTokens: revokedTokenResult.changes
    };
  }

  // Get database statistics
  getStats() {
    const stats = {
      users: this.db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      activeDebuggingStates: this.db.prepare('SELECT COUNT(*) as count FROM debugging_states WHERE expires_at > CURRENT_TIMESTAMP').get().count,
      activeTokens: this.db.prepare('SELECT COUNT(*) as count FROM auth_tokens WHERE expires_at > CURRENT_TIMESTAMP AND revoked = FALSE').get().count,
      revokedTokensInAuditTrail: this.db.prepare('SELECT COUNT(*) as count FROM auth_tokens WHERE revoked = TRUE').get().count,
      securityEventsLast24h: this.db.prepare('SELECT COUNT(*) as count FROM security_log WHERE timestamp > datetime("now", "-24 hours")').get().count
    };
    return stats;
  }

  close() {
    if (this.db) {
      this.db.close();
      info('Database connection closed');
    }
  }
}

// Graceful shutdown without process.exit
process.on('SIGINT', () => {
  const db = DatabaseManager.getInstance();
  db.close();
  info('Database closed on SIGINT signal');
});

process.on('SIGTERM', () => {
  const db = DatabaseManager.getInstance();
  db.close();
  info('Database closed on SIGTERM signal');
});

export default DatabaseManager;