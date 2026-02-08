/**
 * Security Middleware
 * Implements rate limiting, input validation, CORS, and attack prevention
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import { logger } from './monitoring';

// ========== RATE LIMITING ==========

/**
 * Global rate limiter: 100 requests per 15 minutes
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
    });
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: 15 * 60, // seconds
    });
  },
});

/**
 * Strict rate limiter for expensive endpoints: 10 requests per minute
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many requests to this endpoint, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter: 5 attempts per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Only count failed auth attempts
  message: 'Too many authentication attempts',
});

// ========== INPUT VALIDATION ==========

/**
 * Ethereum address validator
 */
const addressSchema = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{40}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid Ethereum address format',
  });

/**
 * Validate wallet address in request
 */
export function validateWalletAddress(req: Request, res: Response, next: NextFunction) {
  const address = req.body.walletAddress || req.params.address;

  if (!address) {
    return res.status(400).json({
      error: 'Missing wallet address',
      message: 'walletAddress is required',
    });
  }

  const { error } = addressSchema.validate(address);

  if (error) {
    logger.warn('Invalid wallet address', {
      address,
      ip: req.ip,
    });
    return res.status(400).json({
      error: 'Invalid wallet address',
      message: error.message,
    });
  }

  next();
}

/**
 * Validate confession request body
 */
export function validateConfessionRequest(req: Request, res: Response, next: NextFunction) {
  const schema = Joi.object({
    walletAddress: addressSchema,
    options: Joi.object({
      skipCache: Joi.boolean(),
      generateVariations: Joi.boolean(),
    }).optional(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
    });
  }

  next();
}

// ========== XSS & SQL INJECTION PREVENTION ==========

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Middleware to sanitize all request inputs
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }

  next();
}

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}

// ========== CORS CONFIGURATION ==========

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://pontiff.xyz',
      'https://www.pontiff.xyz',
      'https://confess.pontiff.xyz',
      process.env.WEB_BASE_URL,
    ].filter(Boolean);

    if (allowedOrigins.some((allowed) => origin.startsWith(allowed as string))) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
};

// ========== SECURITY HEADERS ==========

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

// ========== REQUEST SIZE LIMITING ==========

export const requestSizeLimits = {
  json: { limit: '10mb' }, // Max JSON payload size
  urlencoded: { limit: '10mb', extended: true },
};

// ========== IP BLOCKING ==========

const blockedIPs = new Set<string>();

export function blockIP(ip: string) {
  blockedIPs.add(ip);
  logger.warn('IP blocked', { ip });
}

export function unblockIP(ip: string) {
  blockedIPs.delete(ip);
  logger.info('IP unblocked', { ip });
}

export function ipBlocker(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;

  if (ip && blockedIPs.has(ip)) {
    logger.warn('Blocked IP attempted access', { ip, url: req.url });
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP has been blocked',
    });
  }

  next();
}

// ========== ATTACK DETECTION ==========

interface AttackMetrics {
  suspiciousRequests: number;
  sqlInjectionAttempts: number;
  xssAttempts: number;
  pathTraversalAttempts: number;
}

const attackMetrics: AttackMetrics = {
  suspiciousRequests: 0,
  sqlInjectionAttempts: 0,
  xssAttempts: 0,
  pathTraversalAttempts: 0,
};

/**
 * Detect common attack patterns
 */
export function attackDetector(req: Request, res: Response, next: NextFunction) {
  const suspicious = {
    sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b|--|;|\/\*|\*\/)/gi,
    xss: /(<script|<iframe|javascript:|onerror|onload)/gi,
    pathTraversal: /(\.\.\/|\.\.\\)/g,
  };

  const fullUrl = `${req.url}${JSON.stringify(req.body)}${JSON.stringify(req.query)}`;

  if (suspicious.sqlInjection.test(fullUrl)) {
    attackMetrics.sqlInjectionAttempts++;
    attackMetrics.suspiciousRequests++;
    logger.error('SQL injection attempt detected', {
      ip: req.ip,
      url: req.url,
      body: req.body,
    });
    return res.status(403).json({ error: 'Malicious request detected' });
  }

  if (suspicious.xss.test(fullUrl)) {
    attackMetrics.xssAttempts++;
    attackMetrics.suspiciousRequests++;
    logger.error('XSS attempt detected', { ip: req.ip, url: req.url });
    return res.status(403).json({ error: 'Malicious request detected' });
  }

  if (suspicious.pathTraversal.test(fullUrl)) {
    attackMetrics.pathTraversalAttempts++;
    attackMetrics.suspiciousRequests++;
    logger.error('Path traversal attempt detected', { ip: req.ip, url: req.url });
    return res.status(403).json({ error: 'Malicious request detected' });
  }

  next();
}

export function getAttackMetrics(): AttackMetrics {
  return { ...attackMetrics };
}
