import { Request, Response } from 'express';
export declare class MoodController {
    static getUserMoodSelections(req: Request, res: Response): Promise<void>;
    static getLatestMoodSelection(req: Request, res: Response): Promise<void>;
    static createOrUpdateMoodSelection(req: Request, res: Response): Promise<void>;
    static getMoodSelectionsByPage(req: Request, res: Response): Promise<void>;
    static getUserMoodStats(req: Request, res: Response): Promise<void>;
    static getAllMoodSelectionsWithUsers(req: Request, res: Response): Promise<void>;
    static deleteMoodSelection(req: Request, res: Response): Promise<void>;
    static shouldShowMoodSelector(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=moodController.d.ts.map