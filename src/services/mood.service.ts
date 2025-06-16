import { MoodType, MoodSelection } from '@/types/mood';

class MoodService {
  private readonly STORAGE_KEY = 'firetv_mood_selections';
  private readonly MOOD_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Check if we should show mood selector
  shouldShowMoodSelector(userId?: string, currentPage: string = 'main'): boolean {
    try {
      // Check if localStorage is available (client-side only)
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      const lastSelection = this.getLastMoodSelection(userId, currentPage);
      
      if (!lastSelection) {
        return true; // First time visiting today
      }

      const timeDiff = Date.now() - new Date(lastSelection.selectedAt).getTime();
      return timeDiff > this.MOOD_TIMEOUT; // Show if more than 5 minutes passed
      
    } catch (error) {
      console.error('Error checking mood selector visibility:', error);
      return true; // Show on error to be safe
    }
  }

  // Save mood selection
  async saveMoodSelection(mood: MoodType, userId?: string, page: string = 'main'): Promise<MoodSelection> {
    try {
      // Check if localStorage is available (client-side only)
      if (typeof window === 'undefined' || !window.localStorage) {
        throw new Error('Storage not available');
      }

      const moodSelection: MoodSelection = {
        mood,
        selectedAt: new Date(),
        userId,
        page
      };

      const selections = await this.getAllMoodSelections();
      
      // Remove existing selection for this user/page combination
      const filteredSelections = selections.filter(selection => 
        !(selection.userId === userId && selection.page === page)
      );
      
      // Add new selection
      const updatedSelections = [...filteredSelections, moodSelection];
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSelections));
      
      return moodSelection;
    } catch (error) {
      console.error('Error saving mood selection:', error);
      throw error;
    }
  }

  // Get last mood selection for user/page
  getLastMoodSelection(userId?: string, page: string = 'main'): MoodSelection | null {
    try {
      // Check if localStorage is available (client-side only)
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }

      const selections = this.getAllMoodSelections();
      
      // Find the most recent selection for this user/page
      const userSelections = selections.filter(selection => 
        selection.userId === userId && selection.page === page
      );
      
      if (userSelections.length === 0) {
        return null;
      }

      // Return the most recent selection
      return userSelections.reduce((latest, current) => 
        new Date(current.selectedAt) > new Date(latest.selectedAt) ? current : latest
      );
    } catch (error) {
      console.error('Error getting last mood selection:', error);
      return null;
    }
  }

  // Get all mood selections from storage
  private getAllMoodSelections(): MoodSelection[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error fetching mood selections:', error);
      return [];
    }
  }

  // Get mood selections for a specific user
  async getUserMoodHistory(userId?: string): Promise<MoodSelection[]> {
    try {
      const selections = this.getAllMoodSelections();
      return selections.filter(selection => selection.userId === userId);
    } catch (error) {
      console.error('Error getting user mood history:', error);
      return [];
    }
  }

  // Clear old mood selections (cleanup function)
  async clearOldSelections(olderThanDays: number = 7): Promise<void> {
    try {
      // Check if localStorage is available (client-side only)
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const selections = this.getAllMoodSelections();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const filteredSelections = selections.filter(selection => 
        new Date(selection.selectedAt) > cutoffDate
      );
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSelections));
    } catch (error) {
      console.error('Error clearing old mood selections:', error);
    }
  }
}

export const moodService = new MoodService(); 