"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeConnection = exports.testConnection = exports.pool = exports.dbConfig = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'firetv_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close connections after 30 seconds of inactivity
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};
exports.pool = new pg_1.Pool(exports.dbConfig);
// Test database connection
const testConnection = async () => {
    try {
        const client = await exports.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};
exports.testConnection = testConnection;
// Graceful shutdown
const closeConnection = async () => {
    try {
        await exports.pool.end();
        console.log('🔒 Database connection pool closed');
    }
    catch (error) {
        console.error('Error closing database connection:', error);
    }
};
exports.closeConnection = closeConnection;
//# sourceMappingURL=database.js.map