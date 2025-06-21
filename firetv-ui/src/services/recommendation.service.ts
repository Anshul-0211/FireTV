// Local types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RecommendationData {
  tmdb_id: number;
  title: string;
  genres: string[];
  vote_average: string | number;
  popularity: string | number;
  overview: string;
  poster_path: string;
  similarity_score: string | number;
  added_at: string;
}

export interface RecommendationsResponse {
  profile: string;
  recommendations: RecommendationData[];
  count: number;
}

export interface RecommendationStats {
  user: {
    id: number;
    username: string;
    display_name: string;
    movies_watched: number;
    loved_count: number;
    good_count: number;
    disliked_count: number;
  };
  recommendations: {
    total_recommendations: number;
    avg_similarity_score: number;
    max_similarity_score: number;
    min_similarity_score: number;
    unique_genres: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class RecommendationService {
  
  /**
   * Get personalized recommendations for a profile
   */
  static async getRecommendations(
    profile: string, 
    limit?: number
  ): Promise<RecommendationsResponse> {
    try {
      const url = `${API_BASE_URL}/recommendations/${profile}${limit ? `?limit=${limit}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse<RecommendationsResponse> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get recommendations');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  /**
   * Get recommendation statistics for a profile
   */
  static async getRecommendationStats(profile: string): Promise<RecommendationStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/${profile}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendation stats: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse<RecommendationStats> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get recommendation stats');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching recommendation stats:', error);
      throw error;
    }
  }

  /**
   * Refresh recommendations for a profile
   */
  static async refreshRecommendations(profile: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/${profile}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh recommendations: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      throw error;
    }
  }

  /**
   * Refresh recommendations for all profiles
   */
  static async refreshAllRecommendations(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/refresh-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh all recommendations: ${response.status} ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error refreshing all recommendations:', error);
      throw error;
    }
  }

  /**
   * Convert recommendation data to Movie format for compatibility
   */
  static convertToMovieFormat(recommendation: RecommendationData): any {
    return {
      id: recommendation.tmdb_id,
      tmdbId: recommendation.tmdb_id,
      title: recommendation.title,
      genre: recommendation.genres[0] || 'Unknown',
      genres: recommendation.genres,
      description: recommendation.overview,
      overview: recommendation.overview,
      rating: Number(recommendation.vote_average) || 0,
      vote_average: Number(recommendation.vote_average) || 0,
      voteAverage: Number(recommendation.vote_average) || 0,
      popularity: Number(recommendation.popularity) || 0,
      poster: recommendation.poster_path,
      poster_path: recommendation.poster_path,
      similarity_score: Number(recommendation.similarity_score) || 0,
      added_at: recommendation.added_at,
      image: `https://image.tmdb.org/t/p/w500${recommendation.poster_path}`,
      backdropImage: `https://image.tmdb.org/t/p/w1280${recommendation.poster_path}`,
      year: new Date().getFullYear(),
      runtime: 120,
    };
  }
} 