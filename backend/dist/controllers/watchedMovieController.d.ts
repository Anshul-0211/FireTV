import { Request, Response } from 'express';
export declare class WatchedMovieController {
    static getUserWatchedMovies(req: Request, res: Response): Promise<void>;
    static getWatchedStatus(req: Request, res: Response): Promise<void>;
    static markAsWatched(req: Request, res: Response): Promise<void>;
    static updateWatchedMovie(req: Request, res: Response): Promise<void>;
    static removeFromWatched(req: Request, res: Response): Promise<void>;
    static getUserMovieStats(req: Request, res: Response): Promise<void>;
    static getMoviesByRating(req: Request, res: Response): Promise<void>;
    static getMoviesByMood(req: Request, res: Response): Promise<void>;
    static getAllWatchedMoviesWithUsers(req: Request, res: Response): Promise<void>;
    static getRecentlyWatchedMovies(req: Request, res: Response): Promise<void>;
    private static triggerRecommendationRefresh;
}
//# sourceMappingURL=watchedMovieController.d.ts.map