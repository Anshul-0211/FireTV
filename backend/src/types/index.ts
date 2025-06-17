// User Types
export interface User {
  id: number;
  username: string;
  email?: string;
  display_name: string;
  avatar_url?: string;
  preferences?: UserPreferences;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  favorite_genres: string[];
  preferred_moods: MoodType[];
  theme_color?: string;
}

// Mood Types (matching frontend)
export enum MoodType {
  SAD = 'sad',
  JUST_FINE = 'just_fine',
  NEUTRAL = 'neutral',
  CHEERFUL = 'cheerful',
  VERY_HAPPY = 'very_happy'
}

export interface MoodSelection {
  id: number;
  user_id: number;
  mood: MoodType;
  selected_at: Date;
  page: string; // Which page the mood was selected on
}

// Movie Types (matching frontend)
export enum MovieRating {
  DISLIKED = 'disliked',     // thumbs down
  GOOD = 'good',             // one thumbs up
  LOVED = 'loved'            // two thumbs up
}

export interface WatchedMovie {
  id: number;
  user_id: number;
  movie_id: number;
  tmdb_id: number;
  title: string;
  watched_at: Date;
  rating: MovieRating;
  current_mood?: MoodType; // User's mood when they watched the movie
  created_at: Date;
  updated_at: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  message?: string;
}

// Database Query Types
export interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
}

export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Request/Response Types for API endpoints
export interface CreateUserRequest {
  username: string;
  email?: string;
  display_name: string;
  avatar_url?: string;
  preferences?: UserPreferences;
}

export interface UpdateUserRequest {
  display_name?: string;
  email?: string;
  avatar_url?: string;
  preferences?: UserPreferences;
}

export interface CreateMoodSelectionRequest {
  mood: MoodType;
  page: string;
}

export interface CreateWatchedMovieRequest {
  movie_id: number;
  tmdb_id: number;
  title: string;
  rating: MovieRating;
  current_mood?: MoodType;
}

export interface UpdateWatchedMovieRequest {
  rating?: MovieRating;
  current_mood?: MoodType;
} 