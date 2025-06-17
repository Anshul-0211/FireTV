import { Router } from 'express';
import userRoutes from './userRoutes';
import moodRoutes from './moodRoutes';
import watchedMovieRoutes from './watchedMovieRoutes';

const router = Router();

// API Routes
router.use('/users', userRoutes);
router.use('/moods', moodRoutes);
router.use('/watched-movies', watchedMovieRoutes);

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
      health: '/api/health'
    },
    documentation: 'See README.md for API documentation'
  });
});

export default router; 