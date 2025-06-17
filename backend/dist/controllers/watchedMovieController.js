"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchedMovieController = void 0;
const WatchedMovie_1 = require("../models/WatchedMovie");
const types_1 = require("../types");
class WatchedMovieController {
    // GET /api/watched-movies/user/:userId - Get watched movies for a user
    static async getUserWatchedMovies(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
            const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const result = await WatchedMovie_1.WatchedMovieModel.getUserWatchedMovies(userId, limit, offset);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getUserWatchedMovies:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/watched-movies/user/:userId/status/:tmdbId - Get watched status for a specific movie
    static async getWatchedStatus(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const tmdbId = parseInt(req.params.tmdbId);
            if (isNaN(userId) || isNaN(tmdbId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID or TMDB ID'
                });
                return;
            }
            const result = await WatchedMovie_1.WatchedMovieModel.getWatchedStatus(userId, tmdbId);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getWatchedStatus:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // POST /api/watched-movies/user/:userId - Mark movie as watched
    static async markAsWatched(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const watchedData = req.body;
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            // Validate required fields
            if (!watchedData.movie_id || !watchedData.tmdb_id || !watchedData.title || !watchedData.rating) {
                res.status(400).json({
                    success: false,
                    error: 'movie_id, tmdb_id, title, and rating are required'
                });
                return;
            }
            // Validate rating
            if (!Object.values(types_1.MovieRating).includes(watchedData.rating)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid rating'
                });
                return;
            }
            // Validate mood if provided
            if (watchedData.current_mood && !Object.values(types_1.MoodType).includes(watchedData.current_mood)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid mood type'
                });
                return;
            }
            const result = await WatchedMovie_1.WatchedMovieModel.markAsWatched(userId, watchedData);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(201).json({
                success: true,
                data: result.data,
                message: 'Movie marked as watched successfully'
            });
        }
        catch (error) {
            console.error('Error in markAsWatched:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // PUT /api/watched-movies/user/:userId/:tmdbId - Update watched movie
    static async updateWatchedMovie(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const tmdbId = parseInt(req.params.tmdbId);
            const updateData = req.body;
            if (isNaN(userId) || isNaN(tmdbId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID or TMDB ID'
                });
                return;
            }
            // Validate rating if provided
            if (updateData.rating && !Object.values(types_1.MovieRating).includes(updateData.rating)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid rating'
                });
                return;
            }
            // Validate mood if provided
            if (updateData.current_mood && !Object.values(types_1.MoodType).includes(updateData.current_mood)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid mood type'
                });
                return;
            }
            const result = await WatchedMovie_1.WatchedMovieModel.updateWatchedMovie(userId, tmdbId, updateData);
            if (!result.success) {
                let statusCode = 500;
                if (result.error === 'Watched movie not found')
                    statusCode = 404;
                else if (result.error === 'No fields to update')
                    statusCode = 400;
                res.status(statusCode).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data,
                message: 'Watched movie updated successfully'
            });
        }
        catch (error) {
            console.error('Error in updateWatchedMovie:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // DELETE /api/watched-movies/user/:userId/:tmdbId - Remove from watched list
    static async removeFromWatched(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const tmdbId = parseInt(req.params.tmdbId);
            if (isNaN(userId) || isNaN(tmdbId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID or TMDB ID'
                });
                return;
            }
            const result = await WatchedMovie_1.WatchedMovieModel.removeFromWatched(userId, tmdbId);
            if (!result.success) {
                const statusCode = result.error === 'Watched movie not found' ? 404 : 500;
                res.status(statusCode).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: null,
                message: 'Movie removed from watched list successfully'
            });
        }
        catch (error) {
            console.error('Error in removeFromWatched:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/watched-movies/user/:userId/stats - Get user movie statistics
    static async getUserMovieStats(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const result = await WatchedMovie_1.WatchedMovieModel.getUserMovieStats(userId);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getUserMovieStats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/watched-movies/user/:userId/rating/:rating - Get movies by rating
    static async getMoviesByRating(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const rating = req.params.rating;
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            if (!Object.values(types_1.MovieRating).includes(rating)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid rating'
                });
                return;
            }
            const result = await WatchedMovie_1.WatchedMovieModel.getMoviesByRating(userId, rating);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getMoviesByRating:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/watched-movies/user/:userId/mood/:mood - Get movies by mood
    static async getMoviesByMood(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const mood = req.params.mood;
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            if (!Object.values(types_1.MoodType).includes(mood)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid mood type'
                });
                return;
            }
            const result = await WatchedMovie_1.WatchedMovieModel.getMoviesByMood(userId, mood);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getMoviesByMood:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/watched-movies/all - Get all watched movies with user info
    static async getAllWatchedMoviesWithUsers(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
            const result = await WatchedMovie_1.WatchedMovieModel.getAllWatchedMoviesWithUsers(limit);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getAllWatchedMoviesWithUsers:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/watched-movies/recent - Get recently watched movies
    static async getRecentlyWatchedMovies(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const result = await WatchedMovie_1.WatchedMovieModel.getRecentlyWatchedMovies(limit);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getRecentlyWatchedMovies:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
exports.WatchedMovieController = WatchedMovieController;
//# sourceMappingURL=watchedMovieController.js.map