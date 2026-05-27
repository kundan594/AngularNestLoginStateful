import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
  }),
);

export const createLogger = () => {
  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'info',
    }),
  ];

  // File transports for production
  if (process.env.NODE_ENV === 'production') {
    // Error logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      }),
    );

    // Combined logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      }),
    );

    // Security logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/security-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'warn',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '90d', // Keep security logs longer
        zippedArchive: true,
      }),
    );
  }

  return WinstonModule.createLogger({
    transports,
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
  });
};

// Made with Bob
