const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database
const { initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply middleware
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON format' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
const complaintsRoutes = require('./routes/complaints');
app.use('/api/complaints', complaintsRoutes);

const departmentsRoutes = require('./routes/departments');
const usersRoutes = require('./routes/users');
app.use('/api/departments', departmentsRoutes);
app.use('/api/users', usersRoutes);

// API routes will be added here later
app.get('/api', (req, res) => {
  res.json({
    message: 'Hospital Complaints System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      complaints: '/api/complaints',
      admin: '/api/admin'
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      details: 'Request body contains malformed JSON'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: err.message 
    });
  }
  
  if (err.code === '23505') { // PostgreSQL unique constraint error
    return res.status(409).json({ 
      error: 'Duplicate entry',
      details: 'Resource already exists'
    });
  }
  
  if (err.code === '23503') { // PostgreSQL foreign key constraint error
    return res.status(400).json({ 
      error: 'Invalid reference',
      details: 'Referenced resource does not exist'
    });
  }
  
  // Default server error
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔄 Initializing Hospital Complaints System...');
    
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('\n🚀 Hospital Complaints System Backend Started!');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`💾 Database: PostgreSQL (${process.env.DB_HOST}:${process.env.DB_PORT})`);
      console.log(`⚡ API Base URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log('─'.repeat(50));
    });
    
    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      console.log(`\n🔄 ${signal} received, shutting down gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        console.log('❌ Forcing shutdown');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();