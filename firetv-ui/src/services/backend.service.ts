import axios, { AxiosResponse } from 'axios';
import { 
  Movie, 
  RecommendationRequest, 
  BackendRecommendation,
  MoodPreference,
  ApiResponse 
} from '@/types/movie';
import { BACKEND_CONFIG, DEFAULT_HEADERS } from '@/config/api';

/**
 * Backend Service for connecting to recommendation and mood APIs
 * This is prepared for future integration with your backend
 */
class BackendService {
  private baseURL: string;

  constructor() {
    this.baseURL = BACKEND_CONFIG.BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: DEFAULT_HEADERS,
        ...(data && { data }),
        ...(params && { params })
      };

      const response: AxiosResponse<T> = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`Backend API Error for ${endpoint}:`, error);
      throw new Error(`Failed to fetch data from backend: ${error}`);
    }
  }

  // Get mood-based recommendations
  async getMoodRecommendations(request: RecommendationRequest): Promise<ApiResponse<BackendRecommendation>> {
    try {
      const data = await this.makeRequest<BackendRecommendation>(
        BACKEND_CONFIG.ENDPOINTS.RECOMMENDATIONS,
        'POST',
        request
      );
      
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: { movies: [] },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Analyze user mood from input/context
  async analyzeMood(input: {
    text?: string;
    context?: Record<string, any>;
    userId?: string;
  }): Promise<ApiResponse<MoodPreference>> {
    try {
      const data = await this.makeRequest<MoodPreference>(
        BACKEND_CONFIG.ENDPOINTS.MOOD_ANALYSIS,
        'POST',
        input
      );
      
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: { mood: 'happy', intensity: 5 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get trending content from backend
  async getTrending(limit: number = 20): Promise<ApiResponse<Movie[]>> {
    try {
      const data = await this.makeRequest<Movie[]>(
        BACKEND_CONFIG.ENDPOINTS.TRENDING,
        'GET',
        undefined,
        { limit }
      );
      
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Search content with mood context
  async searchWithMood(query: string, mood?: MoodPreference): Promise<ApiResponse<Movie[]>> {
    try {
      const data = await this.makeRequest<Movie[]>(
        BACKEND_CONFIG.ENDPOINTS.SEARCH,
        'POST',
        { query, mood }
      );
      
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Save user preferences
  async saveUserPreferences(userId: string, preferences: {
    favoriteGenres?: string[];
    moodPreferences?: MoodPreference[];
    watchHistory?: number[];
  }): Promise<ApiResponse<boolean>> {
    try {
      await this.makeRequest(
        BACKEND_CONFIG.ENDPOINTS.USER_PREFERENCES,
        'PUT',
        { userId, ...preferences }
      );
      
      return {
        data: true,
        success: true
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<ApiResponse<any>> {
    try {
      const data = await this.makeRequest(
        `${BACKEND_CONFIG.ENDPOINTS.USER_PREFERENCES}/${userId}`,
        'GET'
      );
      
      return {
        data,
        success: true
      };
    } catch (error) {
      return {
        data: {},
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const backendService = new BackendService();
export default backendService;

// Interface for easy service switching
export interface IContentService {
  getTrending(): Promise<ApiResponse<Movie[]>>;
  getPopular(): Promise<ApiResponse<Movie[]>>;
  getRecommendations(request: RecommendationRequest): Promise<ApiResponse<Movie[]>>;
}

// Content service factory - allows easy switching between TMDB and Backend
export const createContentService = (useBackend: boolean = false): IContentService => {
  if (useBackend) {
    // Return backend implementation
    return {
      getTrending: () => backendService.getTrending(),
      getPopular: () => backendService.getTrending(), // Fallback to trending
      getRecommendations: async (request) => {
        const result = await backendService.getMoodRecommendations(request);
        return {
          ...result,
          data: result.data.movies || []
        };
      }
    };
  } else {
    // Return TMDB implementation
    const { tmdbService } = require('./tmdb.service');
    const { transformTMDBToMovie } = require('../utils/movie.utils');
    
    return {
      getTrending: async () => {
        const result = await tmdbService.getTrending();
        return {
          ...result,
          data: result.data.results.map(transformTMDBToMovie)
        };
      },
      getPopular: async () => {
        const result = await tmdbService.getPopular();
        return {
          ...result,
          data: result.data.results.map(transformTMDBToMovie)
        };
      },
      getRecommendations: async () => {
        const result = await tmdbService.getTopRated();
        return {
          ...result,
          data: result.data.results.map(transformTMDBToMovie)
        };
      }
    };
  }
}; 