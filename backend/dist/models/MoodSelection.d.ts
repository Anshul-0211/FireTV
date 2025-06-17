import { MoodSelection, CreateMoodSelectionRequest, QueryResult } from '../types';
export declare class MoodSelectionModel {
    static getUserMoodSelections(userId: number, limit?: number): Promise<QueryResult<MoodSelection[]>>;
    static getLatestMoodSelection(userId: number, page?: string): Promise<QueryResult<MoodSelection | null>>;
    static createOrUpdateMoodSelection(userId: number, moodData: CreateMoodSelectionRequest): Promise<QueryResult<MoodSelection>>;
    static getMoodSelectionsByPage(page: string, limit?: number): Promise<QueryResult<MoodSelection[]>>;
    static getUserMoodStats(userId: number, days?: number): Promise<QueryResult<any>>;
    static getAllMoodSelectionsWithUsers(limit?: number): Promise<QueryResult<any[]>>;
    static deleteMoodSelection(id: number): Promise<QueryResult<boolean>>;
    static deleteUserMoodSelections(userId: number): Promise<QueryResult<boolean>>;
    static shouldShowMoodSelector(userId: number, page?: string): Promise<boolean>;
}
//# sourceMappingURL=MoodSelection.d.ts.map