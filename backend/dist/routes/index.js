"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userRoutes_1 = __importDefault(require("./userRoutes"));
const moodRoutes_1 = __importDefault(require("./moodRoutes"));
const watchedMovieRoutes_1 = __importDefault(require("./watchedMovieRoutes"));
const recommendationRoutes_1 = __importDefault(require("./recommendationRoutes"));
const router = (0, express_1.Router)();
// API Routes
router.use('/users', userRoutes_1.default);
router.use('/moods', moodRoutes_1.default);
router.use('/watched-movies', watchedMovieRoutes_1.default);
router.use('/recommendations', recommendationRoutes_1.default);
// Health check endpoint
router.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'FireTV Backend API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// API info endpoint
router.get('/', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to FireTV Backend API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            moods: '/api/moods',
            watchedMovies: '/api/watched-movies',
            recommendations: '/api/recommendations',
            health: '/api/health'
        },
        documentation: 'See README.md for API documentation'
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map