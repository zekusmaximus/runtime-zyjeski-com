import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf, colorize } = format;

// Custom format for log messages
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create the logger instance
const logger = createLogger({
  format: combine(
    timestamp(),
    colorize(),
    customFormat
  ),
  transports: [
    // Console transport for development
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }),
    // File transport for production
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Utility functions for common log levels
export const debug = (message, meta = {}) => logger.debug(message, meta);
export const info = (message, meta = {}) => logger.info(message, meta);
export const warn = (message, meta = {}) => logger.warn(message, meta);
export const error = (message, meta = {}) => logger.error(message, meta);

export default logger;
