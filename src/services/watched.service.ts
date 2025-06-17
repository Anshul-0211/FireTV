import { WatchedMovie, MovieRating } from '@/types/movie';

class WatchedMovieService {
  private readonly STORAGE_KEY = 'firetv_watched_movies';

  // Get all watched movies (currently from localStorage, later from database)
  async getWatchedMovies(userId?: string): Promise<WatchedMovie[]> {
    try {
      // Check if localStorage is available (client-side only)
      if (typeof window === 'undefined' || !window.localStorage) {
        return [];
      }
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const watchedMovies: WatchedMovie[] = stored ? JSON.parse(stored) : [];
      
      // Filter by userId if provided (for future multi-user support)
      if (userId) {
        return watchedMovies.filter(movie => movie.userId === userId);
      }
      
      return watchedMovies;
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
    userId?: string
  ): Promise<WatchedMovie> {
    try {
      // Check if localStorage is available (client-side only)
      if (typeof window === 'undefined' || !window.localStorage) {
        throw new Error('Storage not available');
      }
      
      const watchedMovies = await this.getWatchedMovies();
      
      const newWatchedMovie: WatchedMovie = {
        movieId,
        tmdbId,
        title,
        rating,
        watchedAt: new Date(),
        userId
      };

      // Remove existing entry if present
      const filteredMovies = watchedMovies.filter(movie => movie.tmdbId !== tmdbId);
      
      // Add new entry
      const updatedMovies = [...filteredMovies, newWatchedMovie];
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedMovies));
      
      return newWatchedMovie;
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      throw error;
    }
  }

  // Get watched status for a specific movie
  async getWatchedStatus(tmdbId: number, userId?: string): Promise<WatchedMovie | null> {
    try {
      const watchedMovies = await this.getWatchedMovies(userId);
      return watchedMovies.find(movie => movie.tmdbId === tmdbId) || null;
    } catch (error) {
      console.error('Error getting watched status:', error);
      return null;
    }
  }

  // Update rating for a watched movie
  async updateRating(tmdbId: number, rating: MovieRating, userId?: string): Promise<void> {
    try {
      const watchedMovies = await this.getWatchedMovies();
      const movieIndex = watchedMovies.findIndex(movie => 
        movie.tmdbId === tmdbId && (!userId || movie.userId === userId)
      );

      if (movieIndex !== -1) {
        watchedMovies[movieIndex].rating = rating;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchedMovies));
      }
    } catch (error) {
      console.error('Error updating movie rating:', error);
      throw error;
    }
  }

  // Remove from watched list
  async removeFromWatched(tmdbId: number, userId?: string): Promise<void> {
    try {
      const watchedMovies = await this.getWatchedMovies();
      const filteredMovies = watchedMovies.filter(movie => 
        movie.tmdbId !== tmdbId || (userId && movie.userId !== userId)
      );
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredMovies));
    } catch (error) {
      console.error('Error removing watched movie:', error);
      throw error;
    }
  }

  // Future: Replace these methods with API calls to your backend
  /*
  async markAsWatchedAPI(movieData: WatchedMovie): Promise<WatchedMovie> {
    const response = await fetch('/api/watched-movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movieData)
    });
    return response.json();
  }

  async getWatchedMoviesAPI(userId: string): Promise<WatchedMovie[]> {
    const response = await fetch(`/api/watched-movies?userId=${userId}`);
    return response.json();
  }
  */
}

export const watchedMovieService = new WatchedMovieService(); 