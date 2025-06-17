"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const watchedMovieController_1 = require("../controllers/watchedMovieController");
const router = (0, express_1.Router)();
// User-specific watched movie routes
router.get('/user/:userId', watchedMovieController_1.WatchedMovieController.getUserWatchedMovies);
router.get('/user/:userId/status/:tmdbId', watchedMovieController_1.WatchedMovieController.getWatchedStatus);
router.post('/user/:userId', watchedMovieController_1.WatchedMovieController.markAsWatched);
router.put('/user/:userId/:tmdbId', watchedMovieController_1.WatchedMovieController.updateWatchedMovie);
router.delete('/user/:userId/:tmdbId', watchedMovieController_1.WatchedMovieController.removeFromWatched);
// User statistics and filtering
router.get('/user/:userId/stats', watchedMovieController_1.WatchedMovieController.getUserMovieStats);
router.get('/user/:userId/rating/:rating', watchedMovieController_1.WatchedMovieController.getMoviesByRating);
router.get('/user/:userId/mood/:mood', watchedMovieController_1.WatchedMovieController.getMoviesByMood);
// Global routes (all users)
router.get('/all', watchedMovieController_1.WatchedMovieController.getAllWatchedMoviesWithUsers);
router.get('/recent', watchedMovieController_1.WatchedMovieController.getRecentlyWatchedMovies);
exports.default = router;
//# sourceMappingURL=watchedMovieRoutes.js.map