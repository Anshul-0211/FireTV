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

// Future Backend API Configuration
export const BACKEND_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  ENDPOINTS: {
    RECOMMENDATIONS: '/api/recommendations',
    MOOD_ANALYSIS: '/api/mood-analysis',
    USER_PREFERENCES: '/api/user/preferences',
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