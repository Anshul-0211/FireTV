"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const init_1 = require("./database/init");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Logging middleware
app.use((0, morgan_1.default)('combined'));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// API routes
app.use('/api', routes_1.default);
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
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Database initialization and server startup
async function startServer() {
    try {
        console.log('🚀 Starting FireTV Backend Server...');
        // Test database connection
        const dbConnected = await (0, database_1.testConnection)();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }
        // Check if tables exist, if not initialize database
        const tablesExist = await init_1.DatabaseInitializer.checkTablesExist();
        if (!tablesExist) {
            console.log('📊 Database tables not found. Initializing...');
            await init_1.DatabaseInitializer.initializeDatabase();
            // Seed test data in development
            if (process.env.NODE_ENV === 'development') {
                console.log('🌱 Seeding test data...');
                await init_1.DatabaseInitializer.seedTestData();
            }
        }
        else {
            console.log('✅ Database tables found');
        }
        // Get database stats
        const stats = await init_1.DatabaseInitializer.getDatabaseStats();
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
        const gracefulShutdown = async (signal) => {
            console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                console.log('🔒 HTTP server closed');
                try {
                    await (0, database_1.closeConnection)();
                    console.log('✅ Graceful shutdown completed');
                    process.exit(0);
                }
                catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };
        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map