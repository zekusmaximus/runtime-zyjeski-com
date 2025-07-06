import jwt from 'jsonwebtoken';
import DatabaseManager from '../database.js';
import { info, warn } from '../logger.js';

const db = DatabaseManager.getInstance();

export async function authenticateWebSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      socket.userId = `guest_${socket.id}`;
      socket.isGuest = true;
      socket.authSessionId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const tokenRecord = db.getToken(decoded.jti);

    if (!tokenRecord || tokenRecord.revoked) {
      throw new Error('Invalid or revoked token');
    }

    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    socket.isGuest = false;
    socket.authSessionId = decoded.sessionId || tokenRecord.session_id;

    info('WebSocket authenticated', {
      userId: socket.userId,
      socketId: socket.id,
      sessionId: socket.authSessionId
    });

    next();
  } catch (err) {
    socket.userId = `guest_${socket.id}`;
    socket.isGuest = true;
    socket.authSessionId = null;

    warn('WebSocket authentication failed, falling back to guest', {
      error: err.message,
      socketId: socket.id
    });

    next();
  }
}
