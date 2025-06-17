import { useState, useEffect } from 'react';
import { WatchedMovie } from '@/types/movie';
import { watchedMovieService } from '@/services/watched.service';

export const useWatchedMovies = (userId?: string) => {
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchedMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const movies = await watchedMovieService.getWatchedMovies(userId);
      setWatchedMovies(movies);
    } catch (err) {
      console.error('Error fetching watched movies:', err);
      setError('Failed to load watched movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchedMovies();
  }, [userId]);

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