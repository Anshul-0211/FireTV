import { Request, Response } from 'express';
import { WatchedMovieModel } from '../models/WatchedMovie';
import { CreateWatchedMovieRequest, UpdateWatchedMovieRequest, ApiResponse, MovieRating, MoodType } from '../types';

export class WatchedMovieController {
  
  // GET /api/watched-movies/user/:userId - Get watched movies for a user
  static async getUserWatchedMovies(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await WatchedMovieModel.getUserWatchedMovies(userId, limit, offset);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getUserWatchedMovies:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/watched-movies/user/:userId/status/:tmdbId - Get watched status for a specific movie
  static async getWatchedStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const tmdbId = parseInt(req.params.tmdbId);
      
      if (isNaN(userId) || isNaN(tmdbId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID or TMDB ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await WatchedMovieModel.getWatchedStatus(userId, tmdbId);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getWatchedStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // POST /api/watched-movies/user/:userId - Mark movie as watched
  static async markAsWatched(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const watchedData: CreateWatchedMovieRequest = req.body;
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate required fields
      if (!watchedData.movie_id || !watchedData.tmdb_id || !watchedData.title || !watchedData.rating) {
        res.status(400).json({
          success: false,
          error: 'movie_id, tmdb_id, title, and rating are required'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate rating
      if (!Object.values(MovieRating).includes(watchedData.rating)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rating'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate mood if provided
      if (watchedData.current_mood && !Object.values(MoodType).includes(watchedData.current_mood)) {
        res.status(400).json({
          success: false,
          error: 'Invalid mood type'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await WatchedMovieModel.markAsWatched(userId, watchedData);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Movie marked as watched successfully'
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in markAsWatched:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // PUT /api/watched-movies/user/:userId/:tmdbId - Update watched movie
  static async updateWatchedMovie(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const tmdbId = parseInt(req.params.tmdbId);
      const updateData: UpdateWatchedMovieRequest = req.body;
      
      if (isNaN(userId) || isNaN(tmdbId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID or TMDB ID'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate rating if provided
      if (updateData.rating && !Object.values(MovieRating).includes(updateData.rating)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rating'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate mood if provided
      if (updateData.current_mood && !Object.values(MoodType).includes(updateData.current_mood)) {
        res.status(400).json({
          success: false,
          error: 'Invalid mood type'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await WatchedMovieModel.updateWatchedMovie(userId, tmdbId, updateData);
      
      if (!result.success) {
        let statusCode = 500;
        if (result.error === 'Watched movie not found') statusCode = 404;
        else if (result.error === 'No fields to update') statusCode = 400;
        
        res.status(statusCode).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Watched movie updated successfully'
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in updateWatchedMovie:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // DELETE /api/watched-movies/user/:userId/:tmdbId - Remove from watched list
  static async removeFromWatched(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const tmdbId = parseInt(req.params.tmdbId);
      
      if (isNaN(userId) || isNaN(tmdbId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID or TMDB ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await WatchedMovieModel.removeFromWatched(userId, tmdbId);
      
      if (!result.success) {
        const statusCode = result.error === 'Watched movie not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: null,
        message: 'Movie removed from watched list successfully'
      } as ApiResponse<null>);
      
    } catch (error) {
      console.error('Error in removeFromWatched:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/watched-movies/user/:userId/stats - Get user movie statistics
  static async getUserMovieStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await WatchedMovieModel.getUserMovieStats(userId);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getUserMovieStats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/watched-movies/user/:userId/rating/:rating - Get movies by rating
  static async getMoviesByRating(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const rating = req.params.rating as MovieRating;
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      if (!Object.values(MovieRating).includes(rating)) {
        res.status(400).json({
          success: false,
          error: 'Invalid rating'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await WatchedMovieModel.getMoviesByRating(userId, rating);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getMoviesByRating:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/watched-movies/user/:userId/mood/:mood - Get movies by mood
  static async getMoviesByMood(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const mood = req.params.mood as MoodType;
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      if (!Object.values(MoodType).includes(mood)) {
        res.status(400).json({
          success: false,
          error: 'Invalid mood type'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await WatchedMovieModel.getMoviesByMood(userId, mood);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getMoviesByMood:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/watched-movies/all - Get all watched movies with user info
  static async getAllWatchedMoviesWithUsers(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const result = await WatchedMovieModel.getAllWatchedMoviesWithUsers(limit);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getAllWatchedMoviesWithUsers:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/watched-movies/recent - Get recently watched movies
  static async getRecentlyWatchedMovies(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const result = await WatchedMovieModel.getRecentlyWatchedMovies(limit);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getRecentlyWatchedMovies:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }
} 