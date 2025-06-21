import { useState, useEffect } from 'react';
import { WatchedMovie } from '@/types/movie';
import { watchedMovieService } from '@/services/watched.service';
import { createWatchedMovieDisplayWithTMDB } from '@/utils/movie.utils';

export interface WatchedMovieWithDetails extends WatchedMovie {
  fullMovieData?: any; // Full TMDB movie data
}

export const useWatchedMovies = (username?: string) => {
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovieWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchedMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get watched movies from backend
      const movies = await watchedMovieService.getWatchedMovies(username);
      
      // Then, fetch TMDB details for each movie
      const moviesWithDetails = await Promise.all(
        movies.map(async (watchedMovie) => {
          try {
            const fullMovieData = await createWatchedMovieDisplayWithTMDB(watchedMovie);
            return {
              ...watchedMovie,
              fullMovieData
            };
          } catch (error) {
            console.error(`Error fetching TMDB details for movie ${watchedMovie.tmdbId}:`, error);
            // Return watched movie without full details if TMDB fetch fails
            return {
              ...watchedMovie,
              fullMovieData: null
            };
          }
        })
      );
      
      setWatchedMovies(moviesWithDetails);
    } catch (err) {
      console.error('Error fetching watched movies:', err);
      setError('Failed to load watched movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchedMovies();
  }, [username]);

  // Function to refresh watched movies (useful when a movie is marked as watched)
  const refreshWatchedMovies = () => {
    fetchWatchedMovies();
  };

  return {
    watchedMovies,
    loading,
    error,
    refreshWatchedMovies
  };
}; 