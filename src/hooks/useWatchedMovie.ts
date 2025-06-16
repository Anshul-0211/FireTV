import { useState, useEffect } from 'react';
import { MovieRating, WatchedMovieState } from '@/types/movie';
import { watchedMovieService } from '@/services/watched.service';

export const useWatchedMovie = (movieId: number, tmdbId: number, title: string, userId?: string) => {
  const [watchedState, setWatchedState] = useState<WatchedMovieState>({
    isWatched: false,
    rating: undefined,
    showRating: false,
    isAnimating: false
  });

  // Load initial watched status
  useEffect(() => {
    const loadWatchedStatus = async () => {
      try {
        const watchedMovie = await watchedMovieService.getWatchedStatus(tmdbId, userId);
        if (watchedMovie) {
          setWatchedState({
            isWatched: true,
            rating: watchedMovie.rating,
            showRating: true,
            isAnimating: false
          });
        }
      } catch (error) {
        console.error('Error loading watched status:', error);
      }
    };

    loadWatchedStatus();
  }, [tmdbId, userId]);

  const markAsWatched = async () => {
    try {
      // Start animation
      setWatchedState(prev => ({
        ...prev,
        isAnimating: true
      }));

      // Save to storage with a default rating that can be changed later
      await watchedMovieService.markAsWatched(movieId, tmdbId, title, MovieRating.GOOD, userId);

      // After animation delay, show watched state
      setTimeout(() => {
        setWatchedState(prev => ({
          ...prev,
          isWatched: true,
          isAnimating: false,
          showRating: true,
          rating: MovieRating.GOOD // Set default rating
        }));
      }, 600); // Animation duration

    } catch (error) {
      console.error('Error marking as watched:', error);
      setWatchedState(prev => ({
        ...prev,
        isAnimating: false
      }));
    }
  };

  const setRating = async (rating: MovieRating) => {
    try {
      // Update rating in storage/database
      await watchedMovieService.updateRating(tmdbId, rating, userId);
      
      setWatchedState(prev => ({
        ...prev,
        rating
      }));
    } catch (error) {
      console.error('Error setting rating:', error);
    }
  };

  const removeWatched = async () => {
    try {
      await watchedMovieService.removeFromWatched(tmdbId, userId);
      setWatchedState({
        isWatched: false,
        rating: undefined,
        showRating: false,
        isAnimating: false
      });
    } catch (error) {
      console.error('Error removing watched status:', error);
    }
  };

  return {
    watchedState,
    markAsWatched,
    setRating,
    removeWatched
  };
}; 