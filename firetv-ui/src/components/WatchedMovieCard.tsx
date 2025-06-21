'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Movie } from '@/types/movie';
import { WatchedMovieWithDetails } from '@/hooks/useWatchedMovies';
import { createWatchedMovieDisplay, getRatingDisplay, getMoodDisplay } from '@/utils/movie.utils';

interface WatchedMovieCardProps {
  watchedMovie: WatchedMovieWithDetails;
  onMovieClick: (movie: Movie) => void;
}

export const WatchedMovieCard: React.FC<WatchedMovieCardProps> = ({ 
  watchedMovie, 
  onMovieClick 
}) => {
  const ratingDisplay = getRatingDisplay(watchedMovie.rating);
  const moodDisplay = getMoodDisplay(watchedMovie.current_Mood);
  
  // Use full TMDB data if available, otherwise fallback to placeholder
  const movieDisplay = watchedMovie.fullMovieData || createWatchedMovieDisplay(watchedMovie);
  
  return (
    <Card 
      className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 hover:scale-105 cursor-pointer p-0 relative"
      onClick={() => onMovieClick(movieDisplay as Movie)}
    >
      <CardContent className="p-0">
        <div className="aspect-[2/3] bg-gray-700 rounded-t-lg mb-3 overflow-hidden relative">
          <img 
            src={movieDisplay.image} 
            alt={movieDisplay.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `data:image/svg+xml;base64,${btoa(`
                <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100%" height="100%" fill="#374151"/>
                  <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">
                    ${movieDisplay.title}
                  </text>
                </svg>
              `)}`;
            }}
          />
          {/* Watched Badge */}
          <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
            <Check className="h-3 w-3 text-white" />
          </div>
          {/* Mood Badge */}
          {watchedMovie.current_Mood && (
            <div className="absolute top-2 left-2 bg-purple-600 rounded-full p-1" title={`Mood: ${moodDisplay.label}`}>
              <span className="text-xs">{moodDisplay.emoji}</span>
            </div>
          )}
        </div>
        <div className="px-3 pb-3">
          <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">{movieDisplay.title}</h3>
          <div className="flex items-center justify-between mb-1">
            <Badge variant="secondary" className="text-xs bg-green-700 text-green-300">
              Watched
            </Badge>
            <span className={`text-xs ${ratingDisplay.color}`}>{ratingDisplay.icon}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {new Date(watchedMovie.watchedAt).toLocaleDateString()}
            </span>
            <span className={`text-xs ${ratingDisplay.color}`}>{ratingDisplay.text}</span>
          </div>
          {/* Mood Display */}
          {watchedMovie.current_Mood && (
            <div className="flex items-center justify-center mt-2">
              <span className="text-xs text-purple-400">
                {moodDisplay.emoji} {moodDisplay.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 