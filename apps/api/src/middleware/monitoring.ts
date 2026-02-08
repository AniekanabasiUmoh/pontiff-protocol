/**
 * Monitoring & Logging Middleware
 * Tracks API performance, errors, and metrics
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// ========== WINSTON LOGGER SETUP ==========
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pontiff-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Write errors to file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // Write all logs to file
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// ========== REQUEST LOGGING MIDDLEWARE ==========
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      logger.error('Request failed', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
}

// ========== ERROR LOGGING MIDDLEWARE ==========
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
  });

  next(err);
}

// ========== PERFORMANCE METRICS ==========
interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  totalDuration: number;
  avgDuration: number;
  slowestEndpoint: { url: string; duration: number };
  requestsByEndpoint: Map<string, { count: number; totalDuration: number }>;
}

const metrics: PerformanceMetrics = {
  requestCount: 0,
  errorCount: 0,
  totalDuration: 0,
  avgDuration: 0,
  slowestEndpoint: { url: '', duration: 0 },
  requestsByEndpoint: new Map(),
};

export function metricsCollector(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.requestCount++;
    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.requestCount;

    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }

    // Track slowest endpoint
    if (duration > metrics.slowestEndpoint.duration) {
      metrics.slowestEndpoint = { url: req.url, duration };
    }

    // Track per-endpoint metrics
    const endpoint = `${req.method} ${req.route?.path || req.url}`;
    const endpointMetrics = metrics.requestsByEndpoint.get(endpoint) || {
      count: 0,
      totalDuration: 0,
    };
    endpointMetrics.count++;
    endpointMetrics.totalDuration += duration;
    metrics.requestsByEndpoint.set(endpoint, endpointMetrics);
  });

  next();
}

/**
 * Get current performance metrics
 */
export function getMetrics(): PerformanceMetrics & {
  topEndpoints: Array<{ endpoint: string; avgDuration: number; count: number }>;
} {
  // Calculate top endpoints by average duration
  const topEndpoints = Array.from(metrics.requestsByEndpoint.entries())
    .map(([endpoint, data]) => ({
      endpoint,
      avgDuration: data.totalDuration / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  return {
    ...metrics,
    topEndpoints,
  };
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics() {
  metrics.requestCount = 0;
  metrics.errorCount = 0;
  metrics.totalDuration = 0;
  metrics.avgDuration = 0;
  metrics.slowestEndpoint = { url: '', duration: 0 };
  metrics.requestsByEndpoint.clear();
}

// ========== HEALTH CHECK ENDPOINT ==========
export function healthCheck(req: Request, res: Response) {
  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    metrics: {
      requests: metrics.requestCount,
      errors: metrics.errorCount,
      avgResponseTime: metrics.avgDuration.toFixed(2) + 'ms',
      errorRate: metrics.requestCount > 0 ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) + '%' : '0%',
    },
    memory: {
      used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    },
    environment: process.env.NODE_ENV || 'development',
  };

  res.json(health);
}

// ========== METRICS ENDPOINT ==========
export function metricsEndpoint(req: Request, res: Response) {
  const detailedMetrics = getMetrics();

  res.json({
    summary: {
      totalRequests: detailedMetrics.requestCount,
      totalErrors: detailedMetrics.errorCount,
      avgDuration: `${detailedMetrics.avgDuration.toFixed(2)}ms`,
      errorRate: `${((detailedMetrics.errorCount / detailedMetrics.requestCount) * 100).toFixed(2)}%`,
    },
    slowestEndpoint: detailedMetrics.slowestEndpoint,
    topEndpoints: detailedMetrics.topEndpoints,
  });
}

// ========== ALERT SYSTEM ==========
interface Alert {
  type: 'ERROR_RATE' | 'SLOW_RESPONSE' | 'MEMORY' | 'UPTIME';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

const alerts: Alert[] = [];

/**
 * Check for alert conditions
 */
export function checkAlerts(): Alert[] {
  const newAlerts: Alert[] = [];

  // Check error rate
  if (metrics.requestCount > 100) {
    const errorRate = (metrics.errorCount / metrics.requestCount) * 100;
    if (errorRate > 10) {
      newAlerts.push({
        type: 'ERROR_RATE',
        severity: errorRate > 25 ? 'CRITICAL' : 'WARNING',
        message: `High error rate detected: ${errorRate.toFixed(2)}%`,
        value: errorRate,
        threshold: 10,
        timestamp: Date.now(),
      });
    }
  }

  // Check average response time
  if (metrics.avgDuration > 5000) {
    newAlerts.push({
      type: 'SLOW_RESPONSE',
      severity: metrics.avgDuration > 10000 ? 'CRITICAL' : 'WARNING',
      message: `Slow average response time: ${metrics.avgDuration.toFixed(2)}ms`,
      value: metrics.avgDuration,
      threshold: 5000,
      timestamp: Date.now(),
    });
  }

  // Check memory usage
  const memoryUsagePercent = (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100;
  if (memoryUsagePercent > 90) {
    newAlerts.push({
      type: 'MEMORY',
      severity: 'CRITICAL',
      message: `High memory usage: ${memoryUsagePercent.toFixed(2)}%`,
      value: memoryUsagePercent,
      threshold: 90,
      timestamp: Date.now(),
    });
  }

  alerts.push(...newAlerts);
  return newAlerts;
}

/**
 * Get all alerts
 */
export function getAlerts(): Alert[] {
  return alerts.slice(-50); // Return last 50 alerts
}

/**
 * Clear alerts
 */
export function clearAlerts() {
  alerts.length = 0;
}
