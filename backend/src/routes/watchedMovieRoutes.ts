import { Router } from 'express';
import { WatchedMovieController } from '../controllers/watchedMovieController';

const router = Router();

// User-specific watched movie routes
router.get('/user/:userId', WatchedMovieController.getUserWatchedMovies);
router.get('/user/:userId/status/:tmdbId', WatchedMovieController.getWatchedStatus);
router.post('/user/:userId', WatchedMovieController.markAsWatched);
router.put('/user/:userId/:tmdbId', WatchedMovieController.updateWatchedMovie);
router.delete('/user/:userId/:tmdbId', WatchedMovieController.removeFromWatched);

// User statistics and filtering
router.get('/user/:userId/stats', WatchedMovieController.getUserMovieStats);
router.get('/user/:userId/rating/:rating', WatchedMovieController.getMoviesByRating);
router.get('/user/:userId/mood/:mood', WatchedMovieController.getMoviesByMood);

// Global routes (all users)
router.get('/all', WatchedMovieController.getAllWatchedMoviesWithUsers);
router.get('/recent', WatchedMovieController.getRecentlyWatchedMovies);

export default router; 