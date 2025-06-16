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
  ArrowLeft
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
import { Movie } from '@/types/movie';
import Link from 'next/link';

export default function ShikharProfile() {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  // Shikhar's preferences - Comedy, Family, Animation
  const { 
    heroContent, 
    trendingMovies, 
    popularMovies, 
    topRatedMovies,
    nowPlayingMovies,
    streamingApps, 
    loading, 
    error, 
    refetch 
  } = useMovieData(false);

  // Filter hero content for Shikhar's preferences
  const shikharHeroContent = heroContent.filter(movie => 
    movie.genre && ['Comedy', 'Family', 'Animation', 'Adventure', 'Fantasy'].includes(movie.genre)
  ).slice(0, 5);

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  // Filter movies for Shikhar's preferences (Comedy, Family, Animation)
  const shikharMovies = (movies: Movie[]) => 
    movies.filter(movie => 
      ['Comedy', 'Family', 'Animation', 'Adventure', 'Fantasy'].includes(movie.genre)
    );

  // Movie Details Modal Component
  const MovieModal = () => {
    if (!isModalOpen || !selectedMovie) return null;

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
                     <Badge className="bg-orange-600 hover:bg-orange-700 text-xs">
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
                  <div className="flex gap-3">
                    <Button className="bg-white text-black hover:bg-gray-200 text-sm px-4 py-2">
                      <Play className="mr-2 h-3 w-3" />
                      Watch Now
                    </Button>
                    <Button variant="outline" className="border-white text-white hover:bg-white/20 text-sm px-4 py-2">
                      <Info className="mr-2 h-3 w-3" />
                      More Info
                    </Button>
                  </div>
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
              target.src = `https://via.placeholder.com/300x450/374151/9CA3AF?text=${encodeURIComponent(movie.title)}`;
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
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold text-white drop-shadow-lg">Shikhar's Fire TV</span>
        </div>
        
        <div className="w-24"></div> {/* Spacer for centering */}
      </header>

      {/* Hero Carousel Section */}
      <div className="relative h-[60vh] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
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
        ) : shikharHeroContent.length > 0 ? (
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
              {shikharHeroContent.map((movie, index) => (
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
                        <Badge className="mb-2 bg-orange-600 hover:bg-orange-700 text-xs">
                          {movie.rating}
                        </Badge>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                          {movie.title}
                        </h1>
                        <p className="text-sm mb-1 text-orange-400">
                          Comedy & Family #{index + 1}
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
              {shikharHeroContent.map((_, index) => (
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

      {/* Original Hero Section (commented out) */}
      <div className="relative h-[66vh] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
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
                <Badge className="mb-4 bg-orange-600 hover:bg-orange-700">
                  {heroContent[currentHeroIndex]?.rating}
                </Badge>
                <h1 className="text-5xl font-bold mb-4 text-white">
                  {heroContent[currentHeroIndex]?.title}
                </h1>
                <p className="text-lg mb-2 text-orange-400">
                  Fun content for Shikhar
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

      {/* Trending Comedy & Family */}
      {!loading && !error && shikharMovies(trendingMovies).length > 0 && (
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold mb-6 text-orange-400">Trending Comedy & Family</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {shikharMovies(trendingMovies).slice(0, 8).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Popular Family Movies */}
      {!loading && !error && popularMovies.length > 0 && (
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold mb-6">Popular Family Movies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {shikharMovies(popularMovies).slice(0, 8).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Top Rated Animation */}
      {!loading && !error && topRatedMovies.length > 0 && (
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold mb-6">Top Rated Animation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {shikharMovies(topRatedMovies).slice(0, 8).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Fantasy Adventures */}
      {!loading && !error && nowPlayingMovies.length > 0 && (
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold mb-6">Fantasy Adventures</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {shikharMovies(nowPlayingMovies).slice(0, 8).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      <MovieModal />
    </div>
  );
} 