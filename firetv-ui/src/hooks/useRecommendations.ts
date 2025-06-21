import { useState, useEffect, useCallback } from 'react';
import { RecommendationService, RecommendationData, RecommendationsResponse } from '@/services/recommendation.service';

export interface UseRecommendationsReturn {
  recommendations: any[]; // Converted to Movie format for compatibility
  rawRecommendations: RecommendationData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refresh: () => Promise<boolean>;
  count: number;
  profile: string;
}

export const useRecommendations = (
  profile: string,
  limit?: number,
  autoFetch: boolean = true
): UseRecommendationsReturn => {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await RecommendationService.getRecommendations(profile, limit);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recommendations';
      setError(errorMessage);
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, limit]);

  const refreshRecommendations = useCallback(async (): Promise<boolean> => {
    if (!profile) return false;

    try {
      const success = await RecommendationService.refreshRecommendations(profile);
      if (success) {
        // Refetch recommendations after successful refresh
        await fetchRecommendations();
      }
      return success;
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      return false;
    }
  }, [profile, fetchRecommendations]);

  useEffect(() => {
    if (autoFetch) {
      fetchRecommendations();
    }
  }, [fetchRecommendations, autoFetch]);

  // Convert recommendations to Movie format for compatibility with existing components
  const convertedRecommendations = data?.recommendations.map(rec => 
    RecommendationService.convertToMovieFormat(rec)
  ) || [];

  return {
    recommendations: convertedRecommendations,
    rawRecommendations: data?.recommendations || [],
    loading,
    error,
    refetch: fetchRecommendations,
    refresh: refreshRecommendations,
    count: data?.count || 0,
    profile: data?.profile || profile,
  };
}; 