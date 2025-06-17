import axios from 'axios';
import { BACKEND_CONFIG, DEFAULT_HEADERS } from '@/config/api';

export interface User {
  id: number;
  username: string;
  email?: string;
  display_name: string;
  avatar_url?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class UserService {
  private baseURL: string;

  constructor() {
    this.baseURL = BACKEND_CONFIG.BASE_URL;
  }

  // Get all users
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.USERS}`,
        { headers: DEFAULT_HEADERS }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users'
      };
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<ApiResponse<User>> {
    try {
      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.USER_BY_USERNAME(username)}`,
        { headers: DEFAULT_HEADERS }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user'
      };
    }
  }

  // Get user by ID
  async getUserById(userId: number): Promise<ApiResponse<User>> {
    try {
      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.USERS}/${userId}`,
        { headers: DEFAULT_HEADERS }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user'
      };
    }
  }

  // Create new user
  async createUser(userData: {
    username: string;
    display_name: string;
    email?: string;
    preferences?: Record<string, any>;
  }): Promise<ApiResponse<User>> {
    try {
      const response = await axios.post(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.USERS}`,
        userData,
        { headers: DEFAULT_HEADERS }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
    }
  }

  // Update user
  async updateUser(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await axios.put(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.USERS}/${userId}`,
        userData,
        { headers: DEFAULT_HEADERS }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user'
      };
    }
  }

  // Check if username is available
  async checkUsernameAvailability(username: string): Promise<ApiResponse<{ available: boolean }>> {
    try {
      const response = await axios.get(
        `${this.baseURL}${BACKEND_CONFIG.ENDPOINTS.USERS}/check-username/${username}`,
        { headers: DEFAULT_HEADERS }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check username'
      };
    }
  }
}

export const userService = new UserService(); 