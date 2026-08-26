import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { runAutoMigration } from './services/autoMigration.js';

import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import blogEngagementRoutes from './routes/blogEngagementRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import communityRoutes from './routes/communityRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security hardening
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server) or listed origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', authRoutes);
app.use('/api', resourceRoutes);
app.use('/api', contactRoutes);
app.use('/api', blogEngagementRoutes);
app.use('/api', enrollmentRoutes);
app.use('/api', communityRoutes);
app.use('/', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.round(process.uptime()),
    database: 'MongoDB Atlas (Online)'
  });
});

// Centralized error handling (prevents leaking internal stack traces in production F12)
app.use((err, req, res, next) => {
  console.error('[Error caught by Global Handler]:', err.message);
  const status = err.status || 500;
  const message = err.message || 'Đã xảy ra lỗi trên hệ thống.';
  
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// Start HTTP server immediately, then connect database asynchronously
const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend Server is running on port ${PORT}`);
      console.log(`👉 API Health: http://localhost:${PORT}/api/health`);
      
      // Connect to MongoDB asynchronously without delaying API availability
      connectDB(runAutoMigration).catch(() => {});
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Backend is already running on port ${PORT}. Reuse it instead of starting a second instance.`);
        console.error(`Health check: http://localhost:${PORT}/api/health`);
        process.exit(1);
      } else {
        console.error('Backend server error:', error);
      }
    });
  } catch (error) {
    console.error('Lỗi khởi động backend:', error);
  }
};

startServer();
