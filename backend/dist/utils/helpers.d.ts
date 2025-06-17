import { MoodType, MovieRating } from '../types';
export declare const isValidMoodType: (mood: string) => mood is MoodType;
export declare const isValidMovieRating: (rating: string) => rating is MovieRating;
export declare const formatDate: (date: Date) => string;
export declare const isToday: (date: Date) => boolean;
export declare const daysBetween: (date1: Date, date2: Date) => number;
export declare const getPaginationParams: (query: any) => {
    page: number;
    limit: number;
    offset: number;
};
export declare const createPaginationResponse: (data: any[], total: number, page: number, limit: number) => {
    data: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
};
export declare const sanitizeString: (str: string) => string;
export declare const capitalizeFirst: (str: string) => string;
export declare const getMoodScore: (mood: MoodType) => number;
export declare const getRatingScore: (rating: MovieRating) => number;
export declare const groupBy: <T>(array: T[], key: keyof T) => Record<string, T[]>;
export declare const unique: <T>(array: T[]) => T[];
export declare const createError: (message: string, statusCode?: number) => any;
export declare const isDevelopment: () => boolean;
export declare const isProduction: () => boolean;
//# sourceMappingURL=helpers.d.ts.map