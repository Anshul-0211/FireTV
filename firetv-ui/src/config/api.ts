// TMDB API Configuration
export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  API_KEY: process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your-api-key-here', // You'll need to add this to .env.local
  
  // Image sizes
  POSTER_SIZES: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    xlarge: 'w780',
    original: 'original'
  },
  
  BACKDROP_SIZES: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original'
  }
} as const;

// Backend API Configuration
export const BACKEND_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  ENDPOINTS: {
    // User endpoints
    USERS: '/api/users',
    USER_BY_USERNAME: (username: string) => `/api/users/username/${username}`,
    
    // Mood endpoints
    MOODS: '/api/moods',
    MOOD_SHOULD_SHOW: (userId: number) => `/api/moods/user/${userId}/should-show`,
    MOOD_STATS: (userId: number) => `/api/moods/user/${userId}/stats`,
    MOOD_USER_LATEST: (userId: number) => `/api/moods/user/${userId}/latest`,
    MOOD_USER_ALL: (userId: number) => `/api/moods/user/${userId}`,
    
    // Watched movies endpoints
    WATCHED_MOVIES: '/api/watched-movies',
    WATCHED_MOVIES_BY_USER: (userId: number) => `/api/watched-movies/user/${userId}`,
    WATCHED_MOVIE_STATUS: (userId: number, tmdbId: number) => `/api/watched-movies/user/${userId}/status/${tmdbId}`,
    WATCHED_MOVIE_CREATE: (userId: number) => `/api/watched-movies/user/${userId}`,
    WATCHED_MOVIE_UPDATE: (userId: number, tmdbId: number) => `/api/watched-movies/user/${userId}/${tmdbId}`,
    WATCHED_MOVIE_DELETE: (userId: number, tmdbId: number) => `/api/watched-movies/user/${userId}/${tmdbId}`,
    
    // Health check
    HEALTH: '/api/health',
    
    // Future recommendation endpoints
    RECOMMENDATIONS: '/api/recommendations',
    MOOD_ANALYSIS: '/api/mood-analysis',
    TRENDING: '/api/trending',
    SEARCH: '/api/search'
  }
} as const;

// API Request Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
} as const;

// TMDB API Endpoints
export const TMDB_ENDPOINTS = {
  TRENDING: '/trending/movie/week',
  POPULAR: '/movie/popular',
  TOP_RATED: '/movie/top_rated',
  NOW_PLAYING: '/movie/now_playing',
  UPCOMING: '/movie/upcoming',
  GENRES: '/genre/movie/list',
  MOVIE_DETAILS: (id: number) => `/movie/${id}`,
  SEARCH: '/search/movie'
} as const; 