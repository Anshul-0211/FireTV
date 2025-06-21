import axios, { AxiosResponse } from 'axios';
import { 
  TMDBMovie, 
  TMDBMovieDetails,
  TMDBResponse, 
  TMDBGenresResponse, 
  Movie,
  ApiResponse 
} from '@/types/movie';
import { TMDB_CONFIG, TMDB_ENDPOINTS, DEFAULT_HEADERS } from '@/config/api';

class TMDBService {
  private apiKey: string;
  private baseURL: string;
  private imageBaseURL: string;

  constructor() {
    this.apiKey = TMDB_CONFIG.API_KEY;
    this.baseURL = TMDB_CONFIG.BASE_URL;
    this.imageBaseURL = TMDB_CONFIG.IMAGE_BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.get(`${this.baseURL}${endpoint}`, {
        params: {
          api_key: this.apiKey,
          ...params
        },
        headers: DEFAULT_HEADERS
      });

      return response.data;
    } catch (error) {
      console.error(`TMDB API Error for ${endpoint}:`, error);
      throw new Error(`Failed to fetch data from TMDB: ${error}`);
    }
  }

  // Get trending movies
  async getTrending(page: number = 1): Promise<ApiResponse<TMDBResponse>> {
    try {
      const data = await this.makeRequest<TMDBResponse>(TMDB_ENDPOINTS.TRENDING, { page });
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: { page: 1, results: [], total_pages: 0, total_results: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get popular movies
  async getPopular(page: number = 1): Promise<ApiResponse<TMDBResponse>> {
    try {
      const data = await this.makeRequest<TMDBResponse>(TMDB_ENDPOINTS.POPULAR, { page });
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: { page: 1, results: [], total_pages: 0, total_results: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get top rated movies
  async getTopRated(page: number = 1): Promise<ApiResponse<TMDBResponse>> {
    try {
      const data = await this.makeRequest<TMDBResponse>(TMDB_ENDPOINTS.TOP_RATED, { page });
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: { page: 1, results: [], total_pages: 0, total_results: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get now playing movies
  async getNowPlaying(page: number = 1): Promise<ApiResponse<TMDBResponse>> {
    try {
      const data = await this.makeRequest<TMDBResponse>(TMDB_ENDPOINTS.NOW_PLAYING, { page });
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: { page: 1, results: [], total_pages: 0, total_results: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get upcoming movies
  async getUpcoming(page: number = 1): Promise<ApiResponse<TMDBResponse>> {
    try {
      const data = await this.makeRequest<TMDBResponse>(TMDB_ENDPOINTS.UPCOMING, { page });
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: { page: 1, results: [], total_pages: 0, total_results: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get movie genres
  async getGenres(): Promise<ApiResponse<TMDBGenresResponse>> {
    try {
      const data = await this.makeRequest<TMDBGenresResponse>(TMDB_ENDPOINTS.GENRES);
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: { genres: [] },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Search movies
  async searchMovies(query: string, page: number = 1): Promise<ApiResponse<TMDBResponse>> {
    try {
      const data = await this.makeRequest<TMDBResponse>(TMDB_ENDPOINTS.SEARCH, { 
        query,
        page 
      });
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: { page: 1, results: [], total_pages: 0, total_results: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get movie details by ID
  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    try {
      const data = await this.makeRequest<TMDBMovieDetails>(TMDB_ENDPOINTS.MOVIE_DETAILS(movieId));
      return data;
    } catch (error) {
      console.error(`Error fetching movie details for ID ${movieId}:`, error);
      throw error;
    }
  }

  // Utility methods for image URLs
  getPosterURL(posterPath: string | null, size: keyof typeof TMDB_CONFIG.POSTER_SIZES = 'medium'): string {
    if (!posterPath) return '/placeholder-poster.jpg';
    return `${this.imageBaseURL}/${TMDB_CONFIG.POSTER_SIZES[size]}${posterPath}`;
  }

  getBackdropURL(backdropPath: string | null, size: keyof typeof TMDB_CONFIG.BACKDROP_SIZES = 'large'): string {
    if (!backdropPath) return '/placeholder-backdrop.jpg';
    return `${this.imageBaseURL}/${TMDB_CONFIG.BACKDROP_SIZES[size]}${backdropPath}`;
  }
}

// Export singleton instance
export const tmdbService = new TMDBService();
export default tmdbService; 