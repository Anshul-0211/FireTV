export enum MoodType {
  SAD = 'sad',
  JUST_FINE = 'just_fine',
  NEUTRAL = 'neutral',
  CHEERFUL = 'cheerful',
  VERY_HAPPY = 'very_happy'
}

export interface MoodSelection {
  mood: MoodType;
  selectedAt: Date;
  userId?: string;
  page: string; // Which page the mood was selected on
}

export interface MoodState {
  showMoodSelector: boolean;
  selectedMood?: MoodType;
  lastShownAt?: Date;
  isAnimating: boolean;
}

export const MOOD_CONFIG = {
  [MoodType.SAD]: {
    label: 'Sad',
    emoji: '😢',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    description: 'Feeling down today'
  },
  [MoodType.JUST_FINE]: {
    label: 'Just Fine',
    emoji: '😐',
    color: 'bg-gray-600',
    hoverColor: 'hover:bg-gray-700',
    description: 'Doing okay'
  },
  [MoodType.NEUTRAL]: {
    label: 'Neutral',
    emoji: '🙂',
    color: 'bg-yellow-600',
    hoverColor: 'hover:bg-yellow-700',
    description: 'Feeling balanced'
  },
  [MoodType.CHEERFUL]: {
    label: 'Cheerful',
    emoji: '😊',
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    description: 'In a good mood'
  },
  [MoodType.VERY_HAPPY]: {
    label: 'Very Happy',
    emoji: '😄',
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700',
    description: 'Feeling amazing!'
  }
}; 