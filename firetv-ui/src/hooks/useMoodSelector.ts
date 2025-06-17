import { useState, useEffect, useRef } from 'react';
import { MoodType, MoodState } from '@/types/mood';
import { moodService } from '@/services/mood.service';

export const useMoodSelector = (username?: string, currentPage: string = 'main') => {
  const [moodState, setMoodState] = useState<MoodState>({
    showMoodSelector: false,
    selectedMood: undefined,
    lastShownAt: undefined,
    isAnimating: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if mood selector should be shown
  const checkMoodSelector = async () => {
    try {
      const shouldShow = await moodService.shouldShowMoodSelector(username, currentPage);
      const lastSelection = await moodService.getLastMoodSelection(username, currentPage);
      
      setMoodState(prev => ({
        ...prev,
        showMoodSelector: shouldShow,
        selectedMood: lastSelection?.mood,
        lastShownAt: lastSelection?.selectedAt ? new Date(lastSelection.selectedAt) : undefined
      }));
    } catch (error) {
      console.error('Error checking mood selector:', error);
      // On error, default to showing the selector
      setMoodState(prev => ({
        ...prev,
        showMoodSelector: true
      }));
    }
  };

  // Initial check on component mount
  useEffect(() => {
    const initialCheck = async () => {
      setIsLoading(true);
      await checkMoodSelector();
      setIsLoading(false);
    };

    // Small delay to ensure client-side rendering
    const timeoutId = setTimeout(initialCheck, 100);
    
    return () => clearTimeout(timeoutId);
  }, [username, currentPage]);

  // Set up periodic checking every 5 minutes
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval to check every 5 minutes (300,000 ms)
    intervalRef.current = setInterval(() => {
      checkMoodSelector();
    }, 5 * 60 * 1000);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [username, currentPage]);

  // Select a mood
  const selectMood = async (mood: MoodType) => {
    try {
      setMoodState(prev => ({
        ...prev,
        isAnimating: true
      }));

      // Save mood selection
      await moodService.saveMoodSelection(mood, username, currentPage);

      // Animation delay then hide selector
      setTimeout(() => {
        setMoodState(prev => ({
          ...prev,
          selectedMood: mood,
          showMoodSelector: false,
          isAnimating: false,
          lastShownAt: new Date()
        }));
      }, 800);

    } catch (error) {
      console.error('Error selecting mood:', error);
      setMoodState(prev => ({
        ...prev,
        isAnimating: false
      }));
    }
  };

  // Manually show mood selector (for testing or user request)
  const showMoodSelector = () => {
    setMoodState(prev => ({
      ...prev,
      showMoodSelector: true
    }));
  };

  // Hide mood selector without selecting
  const hideMoodSelector = () => {
    setMoodState(prev => ({
      ...prev,
      showMoodSelector: false
    }));
  };

  // Force check if mood selector should be shown (for manual triggers)
  const recheckMoodSelector = async () => {
    await checkMoodSelector();
  };

  return {
    moodState,
    isLoading,
    selectMood,
    showMoodSelector,
    hideMoodSelector,
    recheckMoodSelector
  };
}; 