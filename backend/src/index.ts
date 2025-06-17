import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { testConnection, closeConnection } from './config/database';
import { DatabaseInitializer } from './database/init';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'FireTV Backend Server',
    version: '1.0.0',
    api: '/api',
    health: '/api/health'
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Database initialization and server startup
async function startServer() {
  try {
    console.log('🚀 Starting FireTV Backend Server...');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Check if tables exist, if not initialize database
    const tablesExist = await DatabaseInitializer.checkTablesExist();
    if (!tablesExist) {
      console.log('📊 Database tables not found. Initializing...');
      await DatabaseInitializer.initializeDatabase();
      
      // Seed test data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🌱 Seeding test data...');
        await DatabaseInitializer.seedTestData();
      }
    } else {
      console.log('✅ Database tables found');
    }
    
    // Get database stats
    const stats = await DatabaseInitializer.getDatabaseStats();
    if (stats) {
      console.log('📊 Database Stats:', stats);
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('🔒 HTTP server closed');
        
        try {
          await closeConnection();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer(); 