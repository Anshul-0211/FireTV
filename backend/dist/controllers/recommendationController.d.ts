import { Request, Response } from 'express';
export declare class RecommendationController {
    static getRecommendations(req: Request, res: Response): Promise<void>;
    static refreshRecommendations(req: Request, res: Response): Promise<void>;
    static refreshAllRecommendations(_req: Request, res: Response): Promise<void>;
    static getRecommendationStats(req: Request, res: Response): Promise<void>;
    static triggerOnWatch(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=recommendationController.d.ts.map