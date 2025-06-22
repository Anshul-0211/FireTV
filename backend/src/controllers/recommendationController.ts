import { Request, Response } from 'express';
import { pool } from '../config/database';
import { spawn } from 'child_process';
import path from 'path';
import { ApiResponse } from '../types';

export class RecommendationController {
  
  // GET /api/recommendations/:username - Get recommendations for a profile
  static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      const limitParam = req.query.limit as string;
      
      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username is required'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate username against known profiles
      const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
      if (!validProfiles.includes(username)) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile name'
        } as ApiResponse<null>);
        return;
      }
      
      const tableName = `${username}_dash`;
      
      // Build query with optional LIMIT
      let query = `
        SELECT tmdb_id, title, genres, vote_average, popularity, 
               overview, poster_path, similarity_score, added_at
        FROM ${tableName} 
        WHERE is_active = TRUE 
        ORDER BY similarity_score DESC, added_at DESC
      `;
      
      const queryParams: any[] = [];
      
      // Only add LIMIT if explicitly provided
      if (limitParam && !isNaN(parseInt(limitParam))) {
        const limit = parseInt(limitParam);
        query += ` LIMIT $1`;
        queryParams.push(limit);
      }
      // No LIMIT clause means return ALL recommendations (dynamic growth)
      
      const result = await pool.query(query, queryParams);
      
      console.log(`📊 Returned ${result.rows.length} recommendations for ${username} (${limitParam ? 'limited to ' + limitParam : 'unlimited'})`);
      
      res.status(200).json({
        success: true,
        data: {
          profile: username,
          recommendations: result.rows,
          count: result.rows.length
        }
      } as ApiResponse<any>);
      
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }
  
  // POST /api/recommendations/:username/refresh - Refresh recommendations for a profile
  static async refreshRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      
      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username is required'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate username against known profiles
      const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
      if (!validProfiles.includes(username)) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile name'
        } as ApiResponse<null>);
        return;
      }
      
      // Call Python recommendation service
      const pythonScriptPath = path.join(__dirname, '../../../src4/firetv_integration.py');
      const pythonProcess = spawn('python3', [pythonScriptPath, 'refresh', username]);
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          res.status(200).json({
            success: true,
            message: `Recommendations refreshed for ${username}`,
            data: { profile: username }
          } as ApiResponse<any>);
        } else {
          console.error('Python script error:', errorData);
          res.status(500).json({
            success: false,
            error: 'Failed to refresh recommendations'
          } as ApiResponse<null>);
        }
      });
      
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }
  
  // POST /api/recommendations/refresh-all - Refresh recommendations for all profiles
  static async refreshAllRecommendations(_req: Request, res: Response): Promise<void> {
    try {
      const profiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
      const results: { [key: string]: boolean } = {};
      
      // Call Python recommendation service for all profiles (using fixed version)
      const pythonScriptPath = path.join(__dirname, '../../../src4/firetv_integration_fixed.py');
      
      // Use appropriate python command for Windows
      let pythonCommand: string;
      if (process.platform === 'win32') {
        pythonCommand = 'python'; // Python 3.13.3 confirmed working
      } else {
        pythonCommand = 'python3';
      }
      
      const pythonProcess = spawn(pythonCommand, [pythonScriptPath, 'refresh-all']);
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Parse results from Python output
          profiles.forEach(profile => {
            results[profile] = outputData.includes(`✅ Successfully refreshed recommendations for ${profile}`);
          });
          
          res.status(200).json({
            success: true,
            message: 'Recommendations refresh completed for all profiles',
            data: { results }
          } as ApiResponse<any>);
        } else {
          console.error('Python script error:', errorData);
          res.status(500).json({
            success: false,
            error: 'Failed to refresh recommendations for all profiles'
          } as ApiResponse<null>);
        }
      });
      
    } catch (error) {
      console.error('Error refreshing all recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }
  
  // GET /api/recommendations/:username/stats - Get recommendation statistics
  static async getRecommendationStats(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      
      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username is required'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate username
      const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
      if (!validProfiles.includes(username)) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile name'
        } as ApiResponse<null>);
        return;
      }
      
      const tableName = `${username}_dash`;
      
      // Get recommendation statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_recommendations,
          AVG(similarity_score) as avg_similarity_score,
          MAX(similarity_score) as max_similarity_score,
          MIN(similarity_score) as min_similarity_score,
          (SELECT COUNT(DISTINCT genre) 
           FROM (SELECT unnest(genres) as genre FROM ${tableName} WHERE is_active = TRUE) as genre_list
          ) as unique_genres
        FROM ${tableName} 
        WHERE is_active = TRUE
      `;
      
      const statsResult = await pool.query(statsQuery);
      
      // Get user watch history count
      const userQuery = `
        SELECT 
          u.id, u.username, u.display_name,
          COUNT(wm.id) as movies_watched,
          COUNT(CASE WHEN wm.rating = 'loved' THEN 1 END) as loved_count,
          COUNT(CASE WHEN wm.rating = 'good' THEN 1 END) as good_count,
          COUNT(CASE WHEN wm.rating = 'disliked' THEN 1 END) as disliked_count
        FROM users u
        LEFT JOIN watched_movies wm ON u.id = wm.user_id
        WHERE u.username = $1
        GROUP BY u.id, u.username, u.display_name
      `;
      
      const userResult = await pool.query(userQuery, [username]);
      
      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        } as ApiResponse<null>);
        return;
      }
      
      const stats = {
        user: userResult.rows[0],
        recommendations: statsResult.rows[0]
      };
      
      res.status(200).json({
        success: true,
        data: stats
      } as ApiResponse<typeof stats>);
      
    } catch (error) {
      console.error('Error getting recommendation stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }
  
  // POST /api/recommendations/trigger-on-watch - Trigger recommendations when user watches a movie
  static async triggerOnWatch(req: Request, res: Response): Promise<void> {
    try {
      const { username, tmdb_id } = req.body;
      
      if (!username || !tmdb_id) {
        res.status(400).json({
          success: false,
          error: 'Username and tmdb_id are required'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate username
      const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
      if (!validProfiles.includes(username)) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile name'
        } as ApiResponse<null>);
        return;
      }
      
      // This endpoint is called when a user marks a movie as watched
      // It should trigger the recommendation engine to refresh recommendations
      
      console.log(`🎬 User ${username} watched movie ${tmdb_id}, triggering recommendation refresh`);
      
      // Call Python recommendation service asynchronously (using fixed version)
      const pythonScriptPath = path.join(__dirname, '../../../src4/firetv_integration_fixed.py');
      
      // Use appropriate python command for Windows
      let pythonCommand: string;
      if (process.platform === 'win32') {
        pythonCommand = 'python'; // Python 3.13.3 confirmed working
      } else {
        pythonCommand = 'python3';
      }
      
      const pythonProcess = spawn(pythonCommand, [pythonScriptPath, 'refresh', username]);
      
      // Don't wait for the process to complete, return immediately
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Recommendations refreshed for ${username} after watching ${tmdb_id}`);
        } else {
          console.error(`❌ Failed to refresh recommendations for ${username}`);
        }
      });
      
      res.status(200).json({
        success: true,
        message: 'Recommendation refresh triggered',
        data: { username, tmdb_id }
      } as ApiResponse<any>);
      
    } catch (error) {
      console.error('Error triggering recommendation refresh:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // POST /api/recommendations/:username/add-incremental - Add 5 new movies when user watches
  static async addIncrementalRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      const count = parseInt(req.body.count) || 10;
      
      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username is required'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate username against known profiles
      const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
      if (!validProfiles.includes(username)) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile name'
        } as ApiResponse<null>);
        return;
      }
      
      // Call Python recommendation service with incremental add command
      const pythonScriptPath = path.join(__dirname, '../../../src4/firetv_integration_fixed.py');
      
      // Use appropriate python command for Windows
      let pythonCommand: string;
      if (process.platform === 'win32') {
        pythonCommand = 'python';
      } else {
        pythonCommand = 'python3';
      }
      
      const pythonProcess = spawn(pythonCommand, [pythonScriptPath, 'add', username, count.toString()]);
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          res.status(200).json({
            success: true,
            message: `Added ${count} new recommendations for ${username}`,
            data: { 
              profile: username, 
              added_count: count,
              output: outputData 
            }
          } as ApiResponse<any>);
        } else {
          console.error('Python script error:', errorData);
          res.status(500).json({
            success: false,
            error: 'Failed to add incremental recommendations'
          } as ApiResponse<null>);
        }
      });
      
    } catch (error) {
      console.error('Error adding incremental recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // POST /api/recommendations/:username/dislike - Handle movie dislike
  static async handleMovieDislike(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      const { tmdb_id } = req.body;
      
      if (!username || !tmdb_id) {
        res.status(400).json({
          success: false,
          error: 'Username and tmdb_id are required'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate username against known profiles
      const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
      if (!validProfiles.includes(username)) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile name'
        } as ApiResponse<null>);
        return;
      }
      
      // Call Python recommendation service with dislike command
      const pythonScriptPath = path.join(__dirname, '../../../src4/firetv_integration_fixed.py');
      
      // Use appropriate python command for Windows
      let pythonCommand: string;
      if (process.platform === 'win32') {
        pythonCommand = 'python';
      } else {
        pythonCommand = 'python3';
      }
      
      const pythonProcess = spawn(pythonCommand, [pythonScriptPath, 'dislike', username, tmdb_id.toString()]);
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          res.status(200).json({
            success: true,
            message: `Processed dislike for movie ${tmdb_id} in ${username}'s profile`,
            data: { 
              profile: username, 
              tmdb_id: tmdb_id,
              output: outputData 
            }
          } as ApiResponse<any>);
        } else {
          console.error('Python script error:', errorData);
          res.status(500).json({
            success: false,
            error: 'Failed to process movie dislike'
          } as ApiResponse<null>);
        }
      });
      
    } catch (error) {
      console.error('Error handling movie dislike:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  // GET /api/recommendations/:username/profile-stats - Get profile growth statistics
  static async getProfileStats(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      
      if (!username) {
        res.status(400).json({
          success: false,
          error: 'Username is required'
        } as ApiResponse<null>);
        return;
      }
      
      // Validate username against known profiles
      const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
      if (!validProfiles.includes(username)) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile name'
        } as ApiResponse<null>);
        return;
      }
      
      // Call Python recommendation service with stats command
      const pythonScriptPath = path.join(__dirname, '../../../src4/firetv_integration_fixed.py');
      
      // Use appropriate python command for Windows
      let pythonCommand: string;
      if (process.platform === 'win32') {
        pythonCommand = 'python';
      } else {
        pythonCommand = 'python3';
      }
      
      const pythonProcess = spawn(pythonCommand, [pythonScriptPath, 'stats', username]);
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          res.status(200).json({
            success: true,
            message: `Profile statistics for ${username}`,
            data: { 
              profile: username,
              stats_output: outputData 
            }
          } as ApiResponse<any>);
        } else {
          console.error('Python script error:', errorData);
          res.status(500).json({
            success: false,
            error: 'Failed to get profile statistics'
          } as ApiResponse<null>);
        }
      });
      
    } catch (error) {
      console.error('Error getting profile statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }
} 