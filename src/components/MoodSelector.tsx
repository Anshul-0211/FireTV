import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoodType, MOOD_CONFIG } from '@/types/mood';
import { X, Heart } from 'lucide-react';

interface MoodSelectorProps {
  isOpen: boolean;
  isAnimating: boolean;
  onMoodSelect: (mood: MoodType) => void;
  onClose: () => void;
  userName?: string;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  isOpen,
  isAnimating,
  onMoodSelect,
  onClose,
  userName
}) => {
  if (!isOpen) return null;

  const handleMoodSelect = (mood: MoodType) => {
    if (!isAnimating) {
      onMoodSelect(mood);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-xl max-w-4xl w-full border border-gray-700 transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-gray-700">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={onClose}
            disabled={isAnimating}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Title */}
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-red-500" />
            <div>
              <h2 className="text-xl font-bold text-white">
                How are you feeling{userName ? `, ${userName}` : ''}?
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Let us know your mood to get personalized recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Mood Options */}
        <div className="p-6">
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(MOOD_CONFIG).map(([moodKey, config]) => {
              const mood = moodKey as MoodType;
              return (
                <Button
                  key={mood}
                  variant="outline"
                  className={`
                    ${config.color} ${config.hoverColor} 
                    border-gray-600 text-white p-4 h-auto flex-col
                    transition-all duration-300 hover:scale-105 hover:border-white/30
                    ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => handleMoodSelect(mood)}
                  disabled={isAnimating}
                  title={config.description}
                >
                  <div className="flex flex-col items-center gap-2 w-full">
                    {/* Mood Emoji */}
                    <div className="text-4xl">
                      {config.emoji}
                    </div>
                    
                    {/* Mood Label */}
                    <div className="text-center">
                      <div className="font-semibold text-sm">
                        {config.label}
                      </div>
                    </div>
                    
                    {/* Badge */}
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white text-xs"
                    >
                      {mood === MoodType.VERY_HAPPY ? 'Pick Me!' : 'Select'}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Your mood helps us curate better content for you. This will be saved locally.
            </p>
          </div>
        </div>

        {/* Loading Animation */}
        {isAnimating && (
          <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-sm">Saving your mood...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 