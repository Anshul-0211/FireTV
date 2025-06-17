export interface User {
    id: number;
    username: string;
    email?: string;
    display_name: string;
    avatar_url?: string;
    preferences?: UserPreferences;
    created_at: Date;
    updated_at: Date;
}
export interface UserPreferences {
    favorite_genres: string[];
    preferred_moods: MoodType[];
    theme_color?: string;
}
export declare enum MoodType {
    SAD = "sad",
    JUST_FINE = "just_fine",
    NEUTRAL = "neutral",
    CHEERFUL = "cheerful",
    VERY_HAPPY = "very_happy"
}
export interface MoodSelection {
    id: number;
    user_id: number;
    mood: MoodType;
    selected_at: Date;
    page: string;
}
export declare enum MovieRating {
    DISLIKED = "disliked",// thumbs down
    GOOD = "good",// one thumbs up
    LOVED = "loved"
}
export interface WatchedMovie {
    id: number;
    user_id: number;
    movie_id: number;
    tmdb_id: number;
    title: string;
    watched_at: Date;
    rating: MovieRating;
    current_mood?: MoodType;
    created_at: Date;
    updated_at: Date;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
    message?: string;
}
export interface DatabaseError extends Error {
    code?: string;
    constraint?: string;
}
export interface QueryResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface CreateUserRequest {
    username: string;
    email?: string;
    display_name: string;
    avatar_url?: string;
    preferences?: UserPreferences;
}
export interface UpdateUserRequest {
    display_name?: string;
    email?: string;
    avatar_url?: string;
    preferences?: UserPreferences;
}
export interface CreateMoodSelectionRequest {
    mood: MoodType;
    page: string;
}
export interface CreateWatchedMovieRequest {
    movie_id: number;
    tmdb_id: number;
    title: string;
    rating: MovieRating;
    current_mood?: MoodType;
}
export interface UpdateWatchedMovieRequest {
    rating?: MovieRating;
    current_mood?: MoodType;
}
//# sourceMappingURL=index.d.ts.map