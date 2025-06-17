"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoodController = void 0;
const MoodSelection_1 = require("../models/MoodSelection");
const types_1 = require("../types");
class MoodController {
    // GET /api/moods/user/:userId - Get mood selections for a user
    static async getUserMoodSelections(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const result = await MoodSelection_1.MoodSelectionModel.getUserMoodSelections(userId, limit);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getUserMoodSelections:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/moods/user/:userId/latest - Get latest mood selection for a user
    static async getLatestMoodSelection(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const page = req.query.page || 'main';
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const result = await MoodSelection_1.MoodSelectionModel.getLatestMoodSelection(userId, page);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getLatestMoodSelection:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // POST /api/moods/user/:userId - Create or update mood selection
    static async createOrUpdateMoodSelection(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const moodData = req.body;
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            // Validate required fields
            if (!moodData.mood || !moodData.page) {
                res.status(400).json({
                    success: false,
                    error: 'Mood and page are required'
                });
                return;
            }
            // Validate mood type
            if (!Object.values(types_1.MoodType).includes(moodData.mood)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid mood type'
                });
                return;
            }
            const result = await MoodSelection_1.MoodSelectionModel.createOrUpdateMoodSelection(userId, moodData);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(201).json({
                success: true,
                data: result.data,
                message: 'Mood selection saved successfully'
            });
        }
        catch (error) {
            console.error('Error in createOrUpdateMoodSelection:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/moods/page/:page - Get mood selections for a specific page
    static async getMoodSelectionsByPage(req, res) {
        try {
            const page = req.params.page;
            const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
            if (!page) {
                res.status(400).json({
                    success: false,
                    error: 'Page is required'
                });
                return;
            }
            const result = await MoodSelection_1.MoodSelectionModel.getMoodSelectionsByPage(page, limit);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getMoodSelectionsByPage:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/moods/user/:userId/stats - Get mood statistics for a user
    static async getUserMoodStats(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const days = req.query.days ? parseInt(req.query.days) : undefined;
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const result = await MoodSelection_1.MoodSelectionModel.getUserMoodStats(userId, days);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getUserMoodStats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/moods/all - Get all mood selections with user info
    static async getAllMoodSelectionsWithUsers(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
            const result = await MoodSelection_1.MoodSelectionModel.getAllMoodSelectionsWithUsers(limit);
            if (!result.success) {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error in getAllMoodSelectionsWithUsers:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // DELETE /api/moods/:id - Delete mood selection by ID
    static async deleteMoodSelection(req, res) {
        try {
            const moodId = parseInt(req.params.id);
            if (isNaN(moodId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid mood selection ID'
                });
                return;
            }
            const result = await MoodSelection_1.MoodSelectionModel.deleteMoodSelection(moodId);
            if (!result.success) {
                const statusCode = result.error === 'Mood selection not found' ? 404 : 500;
                res.status(statusCode).json({
                    success: false,
                    error: result.error
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: null,
                message: 'Mood selection deleted successfully'
            });
        }
        catch (error) {
            console.error('Error in deleteMoodSelection:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/moods/user/:userId/should-show - Check if user should show mood selector
    static async shouldShowMoodSelector(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const page = req.query.page || 'main';
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid user ID'
                });
                return;
            }
            const shouldShow = await MoodSelection_1.MoodSelectionModel.shouldShowMoodSelector(userId, page);
            res.status(200).json({
                success: true,
                data: { shouldShow }
            });
        }
        catch (error) {
            console.error('Error in shouldShowMoodSelector:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
exports.MoodController = MoodController;
//# sourceMappingURL=moodController.js.map