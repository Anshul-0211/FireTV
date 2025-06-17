import { Request, Response } from 'express';
import { MoodSelectionModel } from '../models/MoodSelection';
import { CreateMoodSelectionRequest, ApiResponse, MoodType } from '../types';

export class MoodController {
  
  // GET /api/moods/user/:userId - Get mood selections for a user
  static async getUserMoodSelections(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await MoodSelectionModel.getUserMoodSelections(userId, limit);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getUserMoodSelections:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/moods/user/:userId/latest - Get latest mood selection for a user
  static async getLatestMoodSelection(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const page = req.query.page as string || 'main';
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await MoodSelectionModel.getLatestMoodSelection(userId, page);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getLatestMoodSelection:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // POST /api/moods/user/:userId - Create or update mood selection
  static async createOrUpdateMoodSelection(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const moodData: CreateMoodSelectionRequest = req.body;
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate required fields
      if (!moodData.mood || !moodData.page) {
        res.status(400).json({
          success: false,
          error: 'Mood and page are required'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate mood type
      if (!Object.values(MoodType).includes(moodData.mood)) {
        res.status(400).json({
          success: false,
          error: 'Invalid mood type'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await MoodSelectionModel.createOrUpdateMoodSelection(userId, moodData);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Mood selection saved successfully'
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in createOrUpdateMoodSelection:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/moods/page/:page - Get mood selections for a specific page
  static async getMoodSelectionsByPage(req: Request, res: Response): Promise<void> {
    try {
      const page = req.params.page;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (!page) {
        res.status(400).json({
          success: false,
          error: 'Page is required'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await MoodSelectionModel.getMoodSelectionsByPage(page, limit);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getMoodSelectionsByPage:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/moods/user/:userId/stats - Get mood statistics for a user
  static async getUserMoodStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await MoodSelectionModel.getUserMoodStats(userId, days);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getUserMoodStats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/moods/all - Get all mood selections with user info
  static async getAllMoodSelectionsWithUsers(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const result = await MoodSelectionModel.getAllMoodSelectionsWithUsers(limit);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: result.data
      } as ApiResponse<typeof result.data>);
      
    } catch (error) {
      console.error('Error in getAllMoodSelectionsWithUsers:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // DELETE /api/moods/:id - Delete mood selection by ID
  static async deleteMoodSelection(req: Request, res: Response): Promise<void> {
    try {
      const moodId = parseInt(req.params.id);
      
      if (isNaN(moodId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid mood selection ID'
        } as ApiResponse<null>);
        return;
      }
      
      const result = await MoodSelectionModel.deleteMoodSelection(moodId);
      
      if (!result.success) {
        const statusCode = result.error === 'Mood selection not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        } as ApiResponse<null>);
        return;
      }
      
      res.status(200).json({
        success: true,
        data: null,
        message: 'Mood selection deleted successfully'
      } as ApiResponse<null>);
      
    } catch (error) {
      console.error('Error in deleteMoodSelection:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/moods/user/:userId/should-show - Check if user should show mood selector
  static async shouldShowMoodSelector(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const page = req.query.page as string || 'main';
      
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID'
        } as ApiResponse<null>);
        return;
      }
      
      const shouldShow = await MoodSelectionModel.shouldShowMoodSelector(userId, page);
      
      res.status(200).json({
        success: true,
        data: { shouldShow }
      } as ApiResponse<{ shouldShow: boolean }>);
      
    } catch (error) {
      console.error('Error in shouldShowMoodSelector:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }
} 