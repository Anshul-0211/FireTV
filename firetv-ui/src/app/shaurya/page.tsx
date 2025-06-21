'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Mic, 
  Home, 
  User, 
  Play,
  Info,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Check,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useMovieData } from '@/hooks/useMovieData';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Movie, MovieRating } from '@/types/movie';
import { useWatchedMovie } from '@/hooks/useWatchedMovie';
import { useWatchedMovies, WatchedMovieWithDetails } from '@/hooks/useWatchedMovies';
import { createWatchedMovieDisplay, getRatingDisplay, getMoodDisplay } from '@/utils/movie.utils';
import { WatchedMovieCard } from '@/components/WatchedMovieCard';
import { useMoodSelector } from '@/hooks/useMoodSelector';
import { MoodSelector } from '@/components/MoodSelector';
import Link from 'next/link';

export default function ShauryaProfile() {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  // Fetch personalized recommendations for Shaurya
  const { 
    recommendations: personalizedMovies,
    loading: recommendationsLoading, 
    error: recommendationsError,
    refetch: refetchRecommendations,
    refresh: refreshRecommendations
  } = useRecommendations('shaurya');

  // Fetch general movie data for hero content and streaming apps
  const { 
    heroContent, 
    streamingApps, 
    loading: generalLoading, 
    error: generalError, 
    refetch: refetchGeneral 
  } = useMovieData(false);

  // Fetch watched movies for Shaurya
  const { 
    watchedMovies, 
    loading: watchedLoading, 
    error: watchedError,
    refreshWatchedMovies 
  } = useWatchedMovies('shaurya');

  // Mood selector for Shaurya's profile
  const {
    moodState,
    selectMood,
    hideMoodSelector
  } = useMoodSelector('shaurya', 'shaurya');

  // Combined loading and error states
  const loading = recommendationsLoading || generalLoading;
  const error = recommendationsError || generalError;

  // Debug: Log movie count for Shaurya
  if (personalizedMovies.length > 0) {
    console.log('🎬 Shaurya has', personalizedMovies.length, 'personalized movies');
  }

  // Refetch function that refreshes both recommendations and general data
  const refetch = async () => {
    await Promise.all([refetchRecommendations(), refetchGeneral()]);
  };

  // Filter hero content for Shaurya's preferences
  const shauryaHeroContent = heroContent.filter(movie => 
    movie.genre && ['Horror', 'Sci-Fi', 'Fantasy', 'Thriller', 'Adventure'].includes(movie.genre)
  ).slice(0, 5);

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  // Movie Details Modal Component with Watched functionality
  const MovieModal = () => {
    if (!isModalOpen || !selectedMovie) return null;

    // Use watched movie hook for Shaurya
    const { watchedState, markAsWatched, setRating } = useWatchedMovie(
      selectedMovie.id,
      selectedMovie.tmdbId || selectedMovie.id,
      selectedMovie.title,
      'shaurya', // User ID for profile
      'shaurya' // Current page
    );

    // Refresh watched movies when a movie is marked as watched
    const handleMarkAsWatched = async () => {
      await markAsWatched();
      refreshWatchedMovies(); // Refresh the watched movies list
    };

    const WatchedButton = () => {
      if (watchedState.isWatched && !watchedState.isAnimating) {
        return (
          <div className="flex items-center gap-3">
            <Button 
              className="bg-green-600 text-white hover:bg-green-700 text-sm px-4 py-2 cursor-default"
              disabled
            >
              <Check className="mr-2 h-3 w-3" />
              Watched
            </Button>
            
            {watchedState.showRating && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Rate:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hover:bg-white/20 p-1 ${
                    watchedState.rating === MovieRating.DISLIKED ? 'bg-red-600 text-white' : 'text-gray-400'
                  }`}
                  onClick={() => setRating(MovieRating.DISLIKED)}
                  title="Didn't like it"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hover:bg-white/20 p-1 ${
                    watchedState.rating === MovieRating.GOOD ? 'bg-blue-600 text-white' : 'text-gray-400'
                  }`}
                  onClick={() => setRating(MovieRating.GOOD)}
                  title="Good"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hover:bg-white/20 p-1 relative ${
                    watchedState.rating === MovieRating.LOVED ? 'bg-yellow-600 text-white' : 'text-gray-400'
                  }`}
                  onClick={() => setRating(MovieRating.LOVED)}
                  title="Loved it!"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <ThumbsUp className="h-3 w-3 absolute -top-1 -right-1" />
                </Button>
              </div>
            )}
          </div>
        );
      }

      return (
        <Button 
          variant="outline" 
          className={`border-white text-white hover:bg-white/20 text-sm px-4 py-2 transition-all duration-300 ${
            watchedState.isAnimating ? 'animate-pulse bg-green-600 border-green-600' : ''
          }`}
          onClick={handleMarkAsWatched}
          disabled={watchedState.isAnimating}
        >
          {watchedState.isAnimating ? (
            <>
              <Check className="mr-2 h-3 w-3 animate-bounce" />
              Marking as Watched...
            </>
          ) : (
            'Watched?'
          )}
        </Button>
      );
    };

    return (
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={closeModal}
      >
        <div 
          className="bg-gray-900 rounded-xl max-w-2xl w-full h-fit max-h-[85vh] border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={closeModal}
            >
              <AlertCircle className="h-6 w-6 rotate-45" />
            </Button>

            <div className="relative h-48 bg-gray-800 rounded-t-xl overflow-hidden">
              <img
                src={selectedMovie.backdropImage}
                alt={selectedMovie.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = selectedMovie.image;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            </div>

            <div className="p-5 -mt-12 relative z-10">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={selectedMovie.image}
                    alt={selectedMovie.title}
                    className="w-24 h-36 object-cover rounded-lg border-2 border-gray-700"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedMovie.title}</h2>
                                     <div className="flex items-center gap-3 mb-3">
                     <Badge className="bg-red-600 hover:bg-red-700 text-xs">
                       {selectedMovie.rating}
                     </Badge>
                     <span className="text-yellow-400 font-semibold text-sm">
                       ★ {selectedMovie.voteAverage.toFixed(1)}/10
                     </span>
                   </div>

                   {/* All Genres */}
                   <div className="flex flex-wrap gap-2 mb-3">
                     {selectedMovie.genres.map((genre, index) => (
                       <Badge key={index} variant="secondary" className="text-xs bg-gray-700 text-gray-300 border border-gray-600">
                         {genre}
                       </Badge>
                     ))}
                   </div>
                  <p className="text-gray-300 text-xs mb-3">
                    Released: {new Date(selectedMovie.releaseDate).toLocaleDateString()}
                  </p>
                  <p className="text-white leading-relaxed mb-4 text-sm line-clamp-4">
                    {selectedMovie.description}
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Button className="bg-white text-black hover:bg-gray-200 text-sm px-4 py-2">
                      <Play className="mr-2 h-3 w-3" />
                      Watch Now
                    </Button>
                    <Button variant="outline" className="border-white text-white hover:bg-white/20 text-sm px-4 py-2">
                      <Info className="mr-2 h-3 w-3" />
                      More Info
                    </Button>
                  </div>

                  {/* Watched Status and Rating */}
                  <WatchedButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <Card 
      className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 hover:scale-105 cursor-pointer p-0"
      onClick={() => handleMovieClick(movie)}
    >
      <CardContent className="p-0">
        <div className="aspect-[2/3] bg-gray-700 rounded-t-lg mb-3 overflow-hidden">
          <img 
            src={movie.image} 
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `data:image/svg+xml;base64,${btoa(`
                <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100%" height="100%" fill="#374151"/>
                  <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">
                    ${movie.title}
                  </text>
                </svg>
              `)}`;
            }}
          />
        </div>
        <div className="px-3 pb-3">
          <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">{movie.title}</h3>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
              {movie.rating}
            </Badge>
            <span className="text-xs text-gray-400">{movie.genre}</span>
          </div>
          <div className="mt-1 flex items-center">
            <span className="text-xs text-yellow-400">★ {movie.voteAverage.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Use the reusable WatchedMovieCard component

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white">
      {/* Profile Header */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        <Link href="/">
          <Button variant="ghost" className="text-white hover:bg-white/20">
            <ArrowLeft className="h-6 w-6 mr-2" />
            Back to Profiles
          </Button>
        </Link>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold text-white drop-shadow-lg">Shaurya's Fire TV</span>
        </div>
        
        <div className="w-24"></div> {/* Spacer for centering */}
      </header>

      {/* Hero Carousel Section */}
      <div className="relative h-[60vh] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
              <p className="text-white/80">Loading your content...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-white/80 max-w-md">Failed to load content</p>
            </div>
          </div>
        ) : shauryaHeroContent.length > 0 ? (
          <Carousel
            plugins={[plugin.current]}
            className="w-full h-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="h-full">
              {shauryaHeroContent.map((movie, index) => (
                <CarouselItem key={movie.id} className="h-full">
                  <div 
                    className="relative w-full size-150 bg-cover bg-center bg-no-repeat transition-all duration-500"
                    style={{
                      backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url('${movie.image}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    
                    <div className="relative z-10 flex items-center h-full p-4 md:p-6">
                      <div className="max-w-xl">
                        <Badge className="mb-2 bg-red-600 hover:bg-red-700 text-xs">
                          {movie.rating}
                        </Badge>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                          {movie.title}
                        </h1>
                        <p className="text-sm mb-1 text-red-400">
                          Horror & Sci-Fi #{index + 1}
                        </p>
                        <p className="text-white/80 mb-3 text-sm leading-relaxed line-clamp-2">
                          {movie.description}
                        </p>
                        
                        <div className="flex space-x-3">
                          <Button 
                            className="bg-white text-black hover:bg-gray-200 px-4 py-2 text-sm"
                          >
                            <Play className="mr-1 h-4 w-4" />
                            Watch Now
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-white text-white hover:bg-white/20 px-4 py-2 text-sm"
                          >
                            <Info className="mr-1 h-4 w-4" />
                            More Info
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselPrevious className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70 h-8 w-8" />
            <CarouselNext className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70 h-8 w-8" />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {shauryaHeroContent.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-white/50 hover:bg-white/80 transition-colors cursor-pointer"
                />
              ))}
            </div>
          </Carousel>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/80">No featured content available</p>
          </div>
        )}
      </div>

      {/* Original Hero Section (replaced) */}
      <div className="relative h-[66vh] overflow-hidden" style={{display: 'none'}}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
              <p className="text-white/80">Loading your content...</p>
            </div>
          </div>
        ) : heroContent.length > 0 ? (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-500"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url('${heroContent[currentHeroIndex]?.image}')`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            
            <div className="relative z-10 flex items-center h-full p-8">
              <div className="max-w-2xl">
                <Badge className="mb-4 bg-red-600 hover:bg-red-700">
                  {heroContent[currentHeroIndex]?.rating}
                </Badge>
                <h1 className="text-5xl font-bold mb-4 text-white">
                  {heroContent[currentHeroIndex]?.title}
                </h1>
                <p className="text-lg mb-2 text-red-400">
                  Thrilling adventures for Shaurya
                </p>
                <p className="text-white/80 mb-6 text-lg leading-relaxed line-clamp-3">
                  {heroContent[currentHeroIndex]?.description}
                </p>
                
                <div className="flex space-x-4">
                  <Button className="bg-white text-black hover:bg-gray-200 px-6 py-3 text-lg">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Now
                  </Button>
                  <Button variant="outline" className="border-white text-white hover:bg-white/20 px-6 py-3 text-lg">
                    <Info className="mr-2 h-5 w-5" />
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation and Streaming Apps */}
      <div className="px-8 pt-4 pb-0 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-shrink-0 mr-8">
            <Button variant="ghost" className="w-18 h-18 p-0 text-white hover:bg-white/20 rounded-lg">
              <User className="h-18 w-18 scale-170" />
            </Button>
            <Button variant="ghost" className="w-18 h-18 p-0 text-white hover:bg-white/20 rounded-lg">
              <Home className="h-18 w-18 scale-170" />
            </Button>
            <Button variant="ghost" className="w-18 h-18 p-0 text-white hover:bg-white/20 rounded-lg">
              <Search className="h-18 w-18 scale-170" />
            </Button>
            <Button variant="ghost" className="w-18 h-18 p-0 text-white hover:bg-white/20 rounded-lg">
              <Mic className="h-18 w-18 scale-170" />
            </Button>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {streamingApps.map((app, index) => (
              <div key={index} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                <div className={`w-24 h-20 ${app.color} rounded-lg flex items-center justify-center mb-2`}>
                  <span className="text-white font-bold text-2xl">{app.logo}</span>
                </div>
                <p className="text-xs text-white text-center">{app.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Recommendations Sections */}
      {!loading && !error && personalizedMovies.length > 0 && (
        <>
          {/* Your Personal Picks */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-red-400 flex items-center">
                🎯 Your Personal Picks
              </h2>
              <Badge variant="secondary" className="bg-red-600 text-red-100">
                {personalizedMovies.length} total movies
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {personalizedMovies.slice(0, 8).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>

          {/* More Horror & Sci-Fi */}
          {personalizedMovies.length > 8 && (
            <div className="px-8 py-6">
              <h2 className="text-2xl font-bold mb-6">🌟 More Horror & Sci-Fi</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {personalizedMovies.slice(8, 16).map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          )}

          {/* Fresh Recommendations */}
          {personalizedMovies.length > 16 && (
            <div className="px-8 py-6">
              <h2 className="text-2xl font-bold mb-6">🔥 Fresh Recommendations</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {personalizedMovies.slice(16).map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* No Recommendations State */}
      {!loading && !error && personalizedMovies.length === 0 && (
        <div className="px-8 py-6">
          <div className="text-center text-gray-400">
            <RefreshCw className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Building your recommendations...</h3>
            <p className="text-sm">Watch some movies to get personalized suggestions!</p>
          </div>
        </div>
      )}

      {/* Watched Movies Section */}
      {!watchedLoading && !watchedError && watchedMovies.length > 0 && (
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-400 flex items-center">
              <Check className="mr-3 h-6 w-6" />
              Watched
            </h2>
            <Badge variant="secondary" className="bg-green-700 text-green-300">
              {watchedMovies.length} movies
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {watchedMovies.map((watchedMovie) => (
              <WatchedMovieCard 
              key={`${watchedMovie.tmdbId}-${watchedMovie.watchedAt}`} 
              watchedMovie={watchedMovie} 
              onMovieClick={handleMovieClick}
            />
            ))}
          </div>
        </div>
      )}

      {/* Empty Watched State */}
      {!watchedLoading && !watchedError && watchedMovies.length === 0 && (
        <div className="px-8 py-6">
          <div className="text-center text-gray-400">
            <Check className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No watched movies yet</h3>
            <p className="text-sm">Start watching movies and mark them as watched to see them here!</p>
          </div>
        </div>
      )}

      <MovieModal />
      
      {/* Mood Selector */}
      <MoodSelector
        isOpen={moodState.showMoodSelector}
        isAnimating={moodState.isAnimating}
        onMoodSelect={selectMood}
        onClose={hideMoodSelector}
        userName="Shaurya"
      />
    </div>
  );
} 