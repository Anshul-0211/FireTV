import { useState, useEffect } from 'react';
import { Movie, HeroContent, StreamingApp } from '@/types/movie';
import { tmdbService } from '@/services/tmdb.service';
import { transformTMDBToMovie, transformTMDBToHero } from '@/utils/movie.utils';
import { createContentService } from '@/services/backend.service';

interface UseMovieDataReturn {
  heroContent: HeroContent[];
  trendingMovies: Movie[];
  popularMovies: Movie[];
  topRatedMovies: Movie[];
  nowPlayingMovies: Movie[];
  streamingApps: StreamingApp[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEFAULT_STREAMING_APPS: StreamingApp[] = [
  { name: "Netflix", logo: "N", color: "bg-red-600" },
  { name: "Prime Video", logo: "prime", color: "bg-blue-600" },
  { name: "Disney+", logo: "D+", color: "bg-blue-700" },
  { name: "Hulu", logo: "hulu", color: "bg-green-500" },
  { name: "YouTube", logo: "YT", color: "bg-red-500" },
  { name: "Freevee", logo: "freevee", color: "bg-purple-600" },
  { name: "MAX", logo: "MAX", color: "bg-purple-700" },
  { name: "Apple TV+", logo: "tv+", color: "bg-black" },
  { name: "Paramount+", logo: "P+", color: "bg-blue-500" },
  { name: "Discovery+", logo: "D+", color: "bg-blue-400" }
];

export const useMovieData = (useBackend: boolean = false): UseMovieDataReturn => {
  const [heroContent, setHeroContent] = useState<HeroContent[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentService = createContentService(useBackend);

  const fetchMovieData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data in parallel for better performance
      const [
        trendingResult,
        popularResult,
        topRatedResult,
        nowPlayingResult
      ] = await Promise.all([
        contentService.getTrending(),
        contentService.getPopular(),
        tmdbService.getTopRated(),
        tmdbService.getNowPlaying()
      ]);

      // Handle trending data
      if (trendingResult.success) {
        setTrendingMovies(trendingResult.data);
      }

      // Create hero content from multiple sources for variety
      const allMoviesForHero: Movie[] = [];
      
      // Add movies from different categories
      if (trendingResult.success) allMoviesForHero.push(...trendingResult.data.slice(0, 2));
      if (popularResult.success) allMoviesForHero.push(...popularResult.data.slice(0, 2));
      if (topRatedResult.success) {
        const topRatedData = topRatedResult.data.results.map(transformTMDBToMovie);
        allMoviesForHero.push(...topRatedData.slice(0, 1));
      }
      if (nowPlayingResult.success) {
        const nowPlayingData = nowPlayingResult.data.results.map(transformTMDBToMovie);
        allMoviesForHero.push(...nowPlayingData.slice(0, 1));
      }

      // Remove duplicates and take first 5
      const uniqueHeroMovies = allMoviesForHero.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      ).slice(0, 5);

      // Transform to HeroContent format
      let heroData = uniqueHeroMovies.map((movie, index) => ({
        id: movie.id,
        title: movie.title.toUpperCase(),
        subtitle: `Watch Now | ${movie.rating}`,
        description: movie.description,
        image: movie.backdropImage || movie.image,
        rating: movie.rating,
        voteAverage: movie.voteAverage,
        genre: movie.genre
      }));

      // Ensure we have at least 5 items for the carousel
      while (heroData.length < 5 && uniqueHeroMovies.length > 0) {
        const duplicateMovie = uniqueHeroMovies[heroData.length % uniqueHeroMovies.length];
        heroData.push({
          id: duplicateMovie.id + heroData.length * 1000, // Unique ID for duplicate
          title: duplicateMovie.title.toUpperCase(),
          subtitle: `Watch Now | ${duplicateMovie.rating}`,
          description: duplicateMovie.description,
          image: duplicateMovie.backdropImage || duplicateMovie.image,
          rating: duplicateMovie.rating,
          voteAverage: duplicateMovie.voteAverage,
          genre: duplicateMovie.genre
        });
      }
      
      setHeroContent(heroData);

      // Handle popular data
      if (popularResult.success) {
        setPopularMovies(popularResult.data);
      }

      // Handle top rated data (transform and set after hero content creation)
      if (topRatedResult.success) {
        const topRatedData = topRatedResult.data.results.map(transformTMDBToMovie);
        setTopRatedMovies(topRatedData);
      }

      // Handle now playing data (transform and set after hero content creation)
      if (nowPlayingResult.success) {
        const nowPlayingData = nowPlayingResult.data.results.map(transformTMDBToMovie);
        setNowPlayingMovies(nowPlayingData);
      }

      // Check if all requests failed
      if (!trendingResult.success && !popularResult.success && !topRatedResult.success && !nowPlayingResult.success) {
        setError('Failed to load movie data. Please check your API configuration.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error fetching movie data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieData();
  }, [useBackend]);

  const refetch = () => {
    fetchMovieData();
  };

  return {
    heroContent,
    trendingMovies,
    popularMovies,
    topRatedMovies,
    nowPlayingMovies,
    streamingApps: DEFAULT_STREAMING_APPS,
    loading,
    error,
    refetch
  };
};

// Hook for specific movie categories
export const useMovieCategory = (category: 'trending' | 'popular' | 'top_rated' | 'now_playing' = 'trending') => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        switch (category) {
          case 'trending':
            result = await tmdbService.getTrending();
            break;
          case 'popular':
            result = await tmdbService.getPopular();
            break;
          case 'top_rated':
            result = await tmdbService.getTopRated();
            break;
          case 'now_playing':
            result = await tmdbService.getNowPlaying();
            break;
        }

        if (result.success) {
          const transformedMovies = result.data.results.map(transformTMDBToMovie);
          setMovies(transformedMovies);
        } else {
          setError(result.error || 'Failed to fetch movies');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category]);

  return { movies, loading, error };
}; 