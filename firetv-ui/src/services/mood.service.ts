import axios from 'axios';
import { MoodType, MoodSelection } from '@/types/mood';
import { BACKEND_CONFIG, DEFAULT_HEADERS } from '@/config/api';
import { userService } from './user.service';

export interface BackendMoodSelection {
  id: number;
  user_id: number;
  mood: string;
  selected_at: string;
  page: string;
}

export interface MoodStats {
  total_selections: number;
  mood_distribution: Record<string, number>;
  recent_moods: BackendMoodSelection[];
}

class MoodService {
  private baseURL: string;

  constructor() {
    this.baseURL = BACKEND_CONFIG.BASE_URL;
  }

  // Convert backend mood to frontend MoodType
  private convertMoodType(backendMood: string): MoodType {
    switch (backendMood) {
      case 'sad': return MoodType.SAD;
      case 'just_fine': return MoodType.JUST_FINE;
      case 'neutral': return MoodType.NEUTRAL;
      case 'cheerful': return MoodType.CHEERFUL;
      case 'very_happy': return MoodType.VERY_HAPPY;
      default: return MoodType.NEUTRAL;
    }
  }

  // Convert frontend MoodType to backend string
  private convertToBackendMood(mood: MoodType): string {
    return mood.toString();
  }

  // Get user ID by username (helper function)
  private async getUserId(username?: string): Promise<number | null> {
    if (!username) return null;
    
    try {
      const userResponse = await userService.getUserByUsername(username);
      return userResponse.success && userResponse.data ? userResponse.data.id : null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  // Check if we should show mood selector
  async shouldShowMoodSelector(username?: string, currentPage: string = 'main'): Promise<boolean> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) return true; // Show for unknown users
      
      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.MOOD_SHOULD_SHOW(userId)}?page=${currentPage}`,
        { headers: DEFAULT_HEADERS }
      );
      
      return response.data.success ? response.data.data.shouldShow : true;
    } catch (error) {
      console.error('Error checking mood selector visibility:', error);
      return true; // Show on error to be safe
    }
  }

  // Save mood selection
  async saveMoodSelection(mood: MoodType, username?: string, page: string = 'main'): Promise<MoodSelection> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) {
        throw new Error('User not found');
      }

      const response = await axios.post(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.MOODS}/user/${userId}`,
        {
          mood: this.convertToBackendMood(mood),
          page
        },
        { headers: DEFAULT_HEADERS }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save mood selection');
      }

      const backendMood = response.data.data as BackendMoodSelection;
      
      return {
        mood: this.convertMoodType(backendMood.mood),
        selectedAt: new Date(backendMood.selected_at),
        userId: username,
        page: backendMood.page
      };
    } catch (error) {
      console.error('Error saving mood selection:', error);
      throw error;
    }
  }

  // Get last mood selection for user/page
  async getLastMoodSelection(username?: string, page: string = 'main'): Promise<MoodSelection | null> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) return null;

      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.MOOD_USER_LATEST(userId)}?page=${page}`,
        { headers: DEFAULT_HEADERS }
      );

      if (!response.data.success || !response.data.data) {
        return null;
      }

      const backendMood = response.data.data as BackendMoodSelection;
      
      return {
        mood: this.convertMoodType(backendMood.mood),
        selectedAt: new Date(backendMood.selected_at),
        userId: username,
        page: backendMood.page
      };
    } catch (error) {
      console.error('Error getting last mood selection:', error);
      return null;
    }
  }

  // Get mood selections for a specific user
  async getUserMoodHistory(username?: string): Promise<MoodSelection[]> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) return [];

      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.MOOD_USER_ALL(userId)}`,
        { headers: DEFAULT_HEADERS }
      );

      if (!response.data.success) {
        return [];
      }

      return response.data.data.map((backendMood: BackendMoodSelection) => ({
        mood: this.convertMoodType(backendMood.mood),
        selectedAt: new Date(backendMood.selected_at),
        userId: username,
        page: backendMood.page
      }));
    } catch (error) {
      console.error('Error getting user mood history:', error);
      return [];
    }
  }

  // Get mood statistics for a user
  async getUserMoodStats(username?: string): Promise<MoodStats | null> {
    try {
      const userId = await this.getUserId(username);
      if (!userId) return null;

      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.MOOD_STATS(userId)}`,
        { headers: DEFAULT_HEADERS }
      );

      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Error getting mood stats:', error);
      return null;
    }
  }

  // Clear old mood selections (cleanup function) - not needed with backend
  async clearOldSelections(olderThanDays: number = 7): Promise<void> {
    // This will be handled by backend cleanup jobs
    console.log('Mood cleanup is handled by backend');
  }
}

export const moodService = new MoodService(); 