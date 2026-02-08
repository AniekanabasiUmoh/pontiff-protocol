import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scannerRoutes from './routes/scanner';
import confessionRoutes from './routes/confession';
import shareRoutes from './routes/share';
import indulgenceRoutes from './routes/indulgence';
import authRoutes from './routes/auth';
import leaderboardRoutes from './routes/leaderboard';
import competitorsRoutes from './routes/competitors';
import debatesRoutes from './routes/debates';
import conversionsRoutes from './routes/conversions';
import dashboardRoutes from './routes/dashboard';
import {
    globalRateLimiter,
    securityHeaders,
    sanitizeRequest,
    ipBlocker,
    attackDetector,
    corsOptions
} from './middleware/security';
import { requestLogger, errorLogger } from './middleware/monitoring';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Security Middleware (applied in order)
app.use(securityHeaders); // Security headers first
app.use(cors(corsOptions)); // Proper CORS configuration
app.use(ipBlocker); // Block malicious IPs
app.use(globalRateLimiter); // Rate limiting
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb to 10mb for security
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(sanitizeRequest); // Input sanitization
app.use(attackDetector); // Attack pattern detection
app.use(requestLogger); // Request logging

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'The Pontiff is watching',
        timestamp: new Date().toISOString(),
        services: {
            database: 'connected',
            blockchain: 'connected',
            ai: 'ready',
            priceOracle: 'cascade (oracle→dex→mock)',
            social: 'ready (mock/live)'
        }
    });
});

// Routes
app.use('/api/auth', authRoutes); // Authentication endpoints
app.use('/api', scannerRoutes);
app.use('/api', confessionRoutes); // Restored original mapping (confessionRoutes likely contains /confess)
app.use('/api/share', shareRoutes);
app.use('/api', indulgenceRoutes); // Metadata and certificate generation
app.use('/api/leaderboard', leaderboardRoutes); // Leaderboard endpoints
app.use('/api/competitors', competitorsRoutes); // Module 9: Agent detection
app.use('/api/debates', debatesRoutes); // Module 10: Auto-debate
app.use('/api/conversions', conversionsRoutes); // Module 11: Conversion tracking
app.use('/api/dashboard', dashboardRoutes); // Module 12: Unified dashboard

// Error handling middleware (must be last)
app.use(errorLogger);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});

app.listen(port, () => {
    console.log(`🔥 Pontiff API running on port ${port}`);
    console.log(`⛪ The Cathedral is open for business`);
    console.log(`📡 Scanner ready at /api/scan/:address`);
    console.log(`🔥 Roaster ready at /api/confess`);
    console.log(`🐦 Share service ready at /api/share`);
    console.log(`🏆 Leaderboards ready at /api/leaderboard/:type`);
    console.log(`🛡️ Security middleware active`);
});
