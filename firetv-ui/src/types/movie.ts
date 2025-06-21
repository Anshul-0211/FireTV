// TMDB API Response Types
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  adult: boolean;
  vote_average: number;
  vote_count: number;
  popularity: number;
  video: boolean;
  original_language: string;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBGenresResponse {
  genres: TMDBGenre[];
}

// TMDB Movie Details Response (different from list response)
export interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genres: TMDBGenre[]; // Different from TMDBMovie which has genre_ids
  adult: boolean;
  vote_average: number;
  vote_count: number;
  popularity: number;
  video: boolean;
  original_language: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  homepage?: string;
  imdb_id?: string;
  status?: string;
  tagline?: string;
}

// Internal App Types (normalized)
export interface Movie {
  id: number;
  tmdbId: number; // TMDB ID for database tracking
  title: string;
  description: string;
  image: string;
  backdropImage: string;
  rating: string;
  genre: string; // Primary genre for backwards compatibility
  genres: string[]; // All genres for the movie
  releaseDate: string;
  voteAverage: number;
  isAdult: boolean;
}

export interface HeroContent {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  rating: string;
  voteAverage?: number;
  genre?: string;
}

export interface StreamingApp {
  name: string;
  logo: string;
  color: string;
  id?: string;
}

// API Response wrapper for future backend integration
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Future backend types (for mood-based recommendations)
export interface MoodPreference {
  mood: 'happy' | 'sad' | 'exciting' | 'relaxing' | 'romantic' | 'thrilling';
  intensity: number; // 1-10
}

export interface RecommendationRequest {
  userId?: string;
  mood?: MoodPreference;
  genres?: string[];
  limit?: number;
  page?: number;
}

export interface BackendRecommendation {
  movies: Movie[];
  mood_analysis?: {
    detected_mood: string;
    confidence: number;
  };
  recommendation_reason?: string;
}

// Database Integration Types
export interface WatchedMovie {
  movieId: number;
  tmdbId: number;
  title: string;
  watchedAt: Date;
  rating: MovieRating;
  userId?: string; // For future user-specific data
  current_Mood?: string; // User's mood when they watched the movie
}

export enum MovieRating {
  DISLIKED = 'disliked',     // thumbs down
  GOOD = 'good',             // one thumbs up
  LOVED = 'loved'            // two thumbs up
}

export interface WatchedMovieState {
  isWatched: boolean;
  rating?: MovieRating;
  showRating: boolean;
  isAnimating: boolean;
} 