import { TMDBMovie, TMDBGenre, Movie, HeroContent } from '@/types/movie';
import { tmdbService } from '@/services/tmdb.service';

// Genre mapping for TMDB genre IDs
export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Transform TMDB movie to internal Movie format
export const transformTMDBToMovie = (tmdbMovie: TMDBMovie): Movie => {
  const primaryGenre = tmdbMovie.genre_ids[0] ? GENRE_MAP[tmdbMovie.genre_ids[0]] || 'Unknown' : 'Unknown';
  const allGenres = tmdbMovie.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean);
  
  return {
    id: tmdbMovie.id,
    tmdbId: tmdbMovie.id, // Store TMDB ID for tracking
    title: tmdbMovie.title,
    description: tmdbMovie.overview,
    image: tmdbService.getPosterURL(tmdbMovie.poster_path),
    backdropImage: tmdbService.getBackdropURL(tmdbMovie.backdrop_path),
    rating: getRatingFromVoteAverage(tmdbMovie.vote_average),
    genre: primaryGenre,
    genres: allGenres.length > 0 ? allGenres : ['Unknown'],
    releaseDate: tmdbMovie.release_date,
    voteAverage: tmdbMovie.vote_average,
    isAdult: tmdbMovie.adult
  };
};

// Transform TMDB movie to Hero content format
export const transformTMDBToHero = (tmdbMovie: TMDBMovie): HeroContent => {
  const primaryGenre = tmdbMovie.genre_ids[0] ? GENRE_MAP[tmdbMovie.genre_ids[0]] || 'Unknown' : 'Unknown';
  
  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title.toUpperCase(),
    subtitle: `Watch Now | ${getRatingFromVoteAverage(tmdbMovie.vote_average)}`,
    description: tmdbMovie.overview,
    image: tmdbService.getBackdropURL(tmdbMovie.backdrop_path, 'original'),
    rating: getRatingFromVoteAverage(tmdbMovie.vote_average),
    voteAverage: tmdbMovie.vote_average,
    genre: primaryGenre
  };
};

// Convert TMDB vote average to TV/Movie rating
export const getRatingFromVoteAverage = (voteAverage: number): string => {
  if (voteAverage >= 8.5) return 'TV-MA';
  if (voteAverage >= 7.5) return 'TV-14';
  if (voteAverage >= 6.5) return 'PG-13';
  if (voteAverage >= 5.5) return 'PG';
  return 'G';
};

// Get genre name from genre ID
export const getGenreName = (genreId: number): string => {
  return GENRE_MAP[genreId] || 'Unknown';
};

// Filter movies by criteria
export const filterMovies = (movies: Movie[], criteria: {
  minRating?: number;
  genres?: string[];
  isAdult?: boolean;
  releasedAfter?: string;
}): Movie[] => {
  return movies.filter(movie => {
    if (criteria.minRating && movie.voteAverage < criteria.minRating) return false;
    if (criteria.genres && !criteria.genres.includes(movie.genre)) return false;
    if (criteria.isAdult !== undefined && movie.isAdult !== criteria.isAdult) return false;
    if (criteria.releasedAfter && movie.releaseDate < criteria.releasedAfter) return false;
    return true;
  });
};

// Sort movies by different criteria
export const sortMovies = (movies: Movie[], sortBy: 'rating' | 'date' | 'title' | 'popularity' = 'rating'): Movie[] => {
  return [...movies].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.voteAverage - a.voteAverage;
      case 'date':
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'popularity':
        return b.voteAverage - a.voteAverage; // Using vote average as popularity proxy
      default:
        return 0;
    }
  });
};

// Get random movies from array
export const getRandomMovies = (movies: Movie[], count: number): Movie[] => {
  const shuffled = [...movies].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Format release date
export const formatReleaseDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Get movie description preview
export const getDescriptionPreview = (description: string, maxLength: number = 150): string => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength).trim() + '...';
};

// Future utility functions for backend integration
export const prepareRecommendationRequest = (userId?: string, preferences?: any) => {
  return {
    userId,
    preferences,
    timestamp: new Date().toISOString()
  };
};

// Convert WatchedMovie back to Movie format for display
export const createWatchedMovieDisplay = (watchedMovie: WatchedMovie): Partial<Movie> => {
  return {
    id: watchedMovie.movieId,
    tmdbId: watchedMovie.tmdbId,
    title: watchedMovie.title,
    // Since we don't store full movie data, we'll use placeholders
    // In a real app, you'd fetch full movie data from TMDB using tmdbId
    description: 'Movie you\'ve watched',
    image: `https://via.placeholder.com/300x450/374151/9CA3AF?text=${encodeURIComponent(watchedMovie.title)}`,
    backdropImage: `https://via.placeholder.com/600x400/374151/9CA3AF?text=${encodeURIComponent(watchedMovie.title)}`,
    rating: 'Watched',
    genre: 'Various',
    genres: ['Various'],
    releaseDate: watchedMovie.watchedAt.toString(),
    voteAverage: 7.0,
    isAdult: false
  };
};

// Get rating display for watched movies
export const getRatingDisplay = (rating: string): { icon: string; color: string; text: string } => {
  switch (rating) {
    case 'disliked':
      return { icon: '👎', color: 'text-red-400', text: 'Didn\'t like it' };
    case 'good':
      return { icon: '👍', color: 'text-blue-400', text: 'Good' };
    case 'loved':
      return { icon: '👍👍', color: 'text-yellow-400', text: 'Loved it!' };
    default:
      return { icon: '📺', color: 'text-gray-400', text: 'Watched' };
  }
};

// Error handling utilities
export const handleAPIError = (error: any): string => {
  if (error.response?.status === 401) {
    return 'API authentication failed. Please check your API key.';
  }
  if (error.response?.status === 404) {
    return 'Content not found.';
  }
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  return error.message || 'An unexpected error occurred.';
}; 