import { WatchedMovie, MovieRating, MoodType, CreateWatchedMovieRequest, UpdateWatchedMovieRequest, QueryResult } from '../types';
export declare class WatchedMovieModel {
    static getUserWatchedMovies(userId: number, limit?: number, offset?: number): Promise<QueryResult<WatchedMovie[]>>;
    static getWatchedStatus(userId: number, tmdbId: number): Promise<QueryResult<WatchedMovie | null>>;
    static markAsWatched(userId: number, watchedData: CreateWatchedMovieRequest): Promise<QueryResult<WatchedMovie>>;
    static updateWatchedMovie(userId: number, tmdbId: number, updateData: UpdateWatchedMovieRequest): Promise<QueryResult<WatchedMovie>>;
    static removeFromWatched(userId: number, tmdbId: number): Promise<QueryResult<boolean>>;
    static getUserMovieStats(userId: number): Promise<QueryResult<any>>;
    static getMoviesByRating(userId: number, rating: MovieRating): Promise<QueryResult<WatchedMovie[]>>;
    static getMoviesByMood(userId: number, mood: MoodType): Promise<QueryResult<WatchedMovie[]>>;
    static getAllWatchedMoviesWithUsers(limit?: number): Promise<QueryResult<any[]>>;
    static getRecentlyWatchedMovies(limit?: number): Promise<QueryResult<any[]>>;
    static deleteUserWatchedMovies(userId: number): Promise<QueryResult<boolean>>;
}
//# sourceMappingURL=WatchedMovie.d.ts.map