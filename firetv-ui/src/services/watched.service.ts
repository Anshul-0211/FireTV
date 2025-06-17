import axios from 'axios';
import { WatchedMovie, MovieRating } from '@/types/movie';
import { BACKEND_CONFIG, DEFAULT_HEADERS } from '@/config/api';
import { userService } from './user.service';
import { moodService } from './mood.service';

export interface BackendWatchedMovie {
  id: number;
  user_id: number;
  movie_id: number;
  tmdb_id: number;
  title: string;
  watched_at: string;
  rating: string;
  current_mood?: string;
  created_at: string;
  updated_at: string;
}

class WatchedMovieService {
  private baseURL: string;

  constructor() {
    this.baseURL = BACKEND_CONFIG.BASE_URL;
  }

  // Convert backend rating to frontend MovieRating
  private convertRating(backendRating: string): MovieRating {
    switch (backendRating) {
      case 'disliked': return MovieRating.DISLIKED;
      case 'good': return MovieRating.GOOD;
      case 'loved': return MovieRating.LOVED;
      default: return MovieRating.GOOD;
    }
  }

  // Convert frontend MovieRating to backend string
  private convertToBackendRating(rating: MovieRating): string {
    return rating.toString();
  }

  // Convert backend watched movie to frontend format
  private convertToFrontendMovie(backendMovie: BackendWatchedMovie, username?: string): WatchedMovie {
    return {
      movieId: backendMovie.movie_id,
      tmdbId: backendMovie.tmdb_id,
      title: backendMovie.title,
      watchedAt: new Date(backendMovie.watched_at),
      rating: this.convertRating(backendMovie.rating),
      userId: username,
      current_Mood: backendMovie.current_mood
    };
  }

  // Get user ID by username (helper function)
  private async getUserId(username?: string): Promise<number | null> {
    if (!username) return null;
    
    try {
      const userResponse = await userService.getUserByUsername(username);
      return userResponse.success && userResponse.data ? userResponse.data.id : null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  // Get all watched movies for a user
  async getWatchedMovies(username?: string): Promise<WatchedMovie[]> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) return [];
      
      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.WATCHED_MOVIES_BY_USER(userId)}`,
        { headers: DEFAULT_HEADERS }
      );
      
      if (!response.data.success) {
        return [];
      }
      
      return response.data.data.map((movie: BackendWatchedMovie) => 
        this.convertToFrontendMovie(movie, username)
      );
    } catch (error) {
      console.error('Error fetching watched movies:', error);
      return [];
    }
  }

  // Mark a movie as watched with rating
  async markAsWatched(
    movieId: number, 
    tmdbId: number, 
    title: string, 
    rating: MovieRating,
    username?: string,
    currentPage?: string
  ): Promise<WatchedMovie> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) {
        throw new Error('User not found');
      }
      
      // Get current mood for the user on this page
      const currentMoodSelection = await moodService.getLastMoodSelection(username, currentPage || 'main');
      const currentMood = currentMoodSelection?.mood?.toString();
      
      const requestData = {
        movie_id: movieId,
        tmdb_id: tmdbId,
        title,
        rating: this.convertToBackendRating(rating),
        current_mood: currentMood
      };

      const response = await axios.post(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.WATCHED_MOVIE_CREATE(userId)}`,
        requestData,
        { headers: DEFAULT_HEADERS }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to mark movie as watched');
      }

      return this.convertToFrontendMovie(response.data.data, username);
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      throw error;
    }
  }

  // Get watched status for a specific movie
  async getWatchedStatus(tmdbId: number, username?: string): Promise<WatchedMovie | null> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) return null;

      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.WATCHED_MOVIE_STATUS(userId, tmdbId)}`,
        { headers: DEFAULT_HEADERS }
      );

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return this.convertToFrontendMovie(response.data.data, username);
    } catch (error) {
      console.error('Error getting watched status:', error);
      return null;
    }
  }

  // Update rating for a watched movie
  async updateRating(tmdbId: number, rating: MovieRating, username?: string): Promise<void> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) {
        throw new Error('User not found');
      }

      const response = await axios.put(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.WATCHED_MOVIE_UPDATE(userId, tmdbId)}`,
        {
          rating: this.convertToBackendRating(rating)
        },
        { headers: DEFAULT_HEADERS }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update rating');
      }
    } catch (error) {
      console.error('Error updating movie rating:', error);
      throw error;
    }
  }

  // Remove from watched list
  async removeFromWatched(tmdbId: number, username?: string): Promise<void> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) {
        throw new Error('User not found');
      }

      const response = await axios.delete(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.WATCHED_MOVIE_DELETE(userId, tmdbId)}`,
        { headers: DEFAULT_HEADERS }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to remove movie from watched list');
      }
    } catch (error) {
      console.error('Error removing watched movie:', error);
      throw error;
    }
  }

  // Get watched movies filtered by rating
  async getWatchedMoviesByRating(rating: MovieRating, username?: string): Promise<WatchedMovie[]> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) return [];

      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.WATCHED_MOVIES}?userId=${userId}&rating=${this.convertToBackendRating(rating)}`,
        { headers: DEFAULT_HEADERS }
      );

      if (!response.data.success) {
        return [];
      }

      return response.data.data.map((movie: BackendWatchedMovie) => 
        this.convertToFrontendMovie(movie, username)
      );
    } catch (error) {
      console.error('Error getting watched movies by rating:', error);
      return [];
    }
  }

  // Get watched movies filtered by mood
  async getWatchedMoviesByMood(mood: string, username?: string): Promise<WatchedMovie[]> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) return [];

      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.WATCHED_MOVIES}?userId=${userId}&mood=${mood}`,
        { headers: DEFAULT_HEADERS }
      );

      if (!response.data.success) {
        return [];
      }

      return response.data.data.map((movie: BackendWatchedMovie) => 
        this.convertToFrontendMovie(movie, username)
      );
    } catch (error) {
      console.error('Error getting watched movies by mood:', error);
      return [];
    }
  }
}

export const watchedMovieService = new WatchedMovieService(); 