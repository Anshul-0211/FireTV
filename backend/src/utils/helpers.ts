import { MoodType, MovieRating } from '../types';

// Validate enum values
export const isValidMoodType = (mood: string): mood is MoodType => {
  return Object.values(MoodType).includes(mood as MoodType);
};

export const isValidMovieRating = (rating: string): rating is MovieRating => {
  return Object.values(MovieRating).includes(rating as MovieRating);
};

// Date utilities
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return formatDate(date) === formatDate(today);
};

export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

// Pagination utilities
export const getPaginationParams = (query: any) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

export const createPaginationResponse = (
  data: any[],
  total: number,
  page: number,
  limit: number
) => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1
    }
  };
};

// String utilities
export const sanitizeString = (str: string): string => {
  return str.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Mood analysis utilities
export const getMoodScore = (mood: MoodType): number => {
  const moodScores = {
    [MoodType.SAD]: 1,
    [MoodType.JUST_FINE]: 2,
    [MoodType.NEUTRAL]: 3,
    [MoodType.CHEERFUL]: 4,
    [MoodType.VERY_HAPPY]: 5
  };
  
  return moodScores[mood] || 3;
};

export const getRatingScore = (rating: MovieRating): number => {
  const ratingScores = {
    [MovieRating.DISLIKED]: 1,
    [MovieRating.GOOD]: 2,
    [MovieRating.LOVED]: 3
  };
  
  return ratingScores[rating] || 2;
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

// Error utilities
export const createError = (message: string, statusCode: number = 500) => {
  const error = new Error(message) as any;
  error.statusCode = statusCode;
  return error;
};

// Environment utilities
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
}; 