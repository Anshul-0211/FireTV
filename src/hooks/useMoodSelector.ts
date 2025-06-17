import { useState, useEffect } from 'react';
import { MoodType, MoodState } from '@/types/mood';
import { moodService } from '@/services/mood.service';

export const useMoodSelector = (userId?: string, currentPage: string = 'main') => {
  const [moodState, setMoodState] = useState<MoodState>({
    showMoodSelector: false,
    selectedMood: undefined,
    lastShownAt: undefined,
    isAnimating: false
  });

  // Check if mood selector should be shown on component mount
  useEffect(() => {
    const checkMoodSelector = () => {
      const shouldShow = moodService.shouldShowMoodSelector(userId, currentPage);
      const lastSelection = moodService.getLastMoodSelection(userId, currentPage);
      
      setMoodState(prev => ({
        ...prev,
        showMoodSelector: shouldShow,
        selectedMood: lastSelection?.mood,
        lastShownAt: lastSelection?.selectedAt ? new Date(lastSelection.selectedAt) : undefined
      }));
    };

    // Small delay to ensure localStorage is available
    const timeoutId = setTimeout(checkMoodSelector, 100);
    
    return () => clearTimeout(timeoutId);
  }, [userId, currentPage]);

  // Select a mood
  const selectMood = async (mood: MoodType) => {
    try {
      setMoodState(prev => ({
        ...prev,
        isAnimating: true
      }));

      // Save mood selection
      await moodService.saveMoodSelection(mood, userId, currentPage);

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

  // Force check if mood selector should be shown (for periodic checks)
  const recheckMoodSelector = () => {
    const shouldShow = moodService.shouldShowMoodSelector(userId, currentPage);
    if (shouldShow && !moodState.showMoodSelector) {
      setMoodState(prev => ({
        ...prev,
        showMoodSelector: true
      }));
    }
  };

  return {
    moodState,
    selectMood,
    showMoodSelector,
    hideMoodSelector,
    recheckMoodSelector
  };
}; 