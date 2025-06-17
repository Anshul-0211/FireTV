import { pool } from '../config/database';
import { MoodSelection, CreateMoodSelectionRequest, QueryResult } from '../types';

export class MoodSelectionModel {
  
  // Get all mood selections for a user
  static async getUserMoodSelections(userId: number, limit?: number): Promise<QueryResult<MoodSelection[]>> {
    try {
      const client = await pool.connect();
      
      let query = `
        SELECT id, user_id, mood, selected_at, page 
        FROM mood_selections 
        WHERE user_id = $1 
        ORDER BY selected_at DESC
      `;
      
      const params: any[] = [userId];
      
      if (limit) {
        query += ` LIMIT $2`;
        params.push(limit);
      }
      
      const result = await client.query(query, params);
      client.release();
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting user mood selections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get latest mood selection for a user on a specific page
  static async getLatestMoodSelection(userId: number, page: string = 'main'): Promise<QueryResult<MoodSelection | null>> {
    try {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT id, user_id, mood, selected_at, page 
        FROM mood_selections 
        WHERE user_id = $1 AND page = $2 
        ORDER BY selected_at DESC 
        LIMIT 1
      `, [userId, page]);
      client.release();
      
      return {
        success: true,
        data: result.rows.length > 0 ? result.rows[0] : null
      };
    } catch (error) {
      console.error('Error getting latest mood selection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Create or update mood selection for a user on a page (single row per user/page)
  static async createOrUpdateMoodSelection(
    userId: number, 
    moodData: CreateMoodSelectionRequest
  ): Promise<QueryResult<MoodSelection>> {
    try {
      const client = await pool.connect();
      
      // Use UPSERT - update if exists, insert if not (single row per user/page)
      const result = await client.query(`
        INSERT INTO mood_selections (user_id, mood, page, selected_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, page) 
        DO UPDATE SET 
          mood = EXCLUDED.mood,
          selected_at = NOW()
        RETURNING id, user_id, mood, selected_at, page
      `, [userId, moodData.mood, moodData.page]);
      
      client.release();
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Error creating/updating mood selection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get mood selections for a specific page (all users)
  static async getMoodSelectionsByPage(page: string, limit?: number): Promise<QueryResult<MoodSelection[]>> {
    try {
      const client = await pool.connect();
      
      let query = `
        SELECT ms.id, ms.user_id, ms.mood, ms.selected_at, ms.page,
               u.username, u.display_name
        FROM mood_selections ms
        JOIN users u ON ms.user_id = u.id
        WHERE ms.page = $1 
        ORDER BY ms.selected_at DESC
      `;
      
      const params: any[] = [page];
      
      if (limit) {
        query += ` LIMIT $2`;
        params.push(limit);
      }
      
      const result = await client.query(query, params);
      client.release();
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting mood selections by page:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get mood statistics for a user
  static async getUserMoodStats(userId: number, days?: number): Promise<QueryResult<any>> {
    try {
      const client = await pool.connect();
      
      let dateFilter = '';
      const params: any[] = [userId];
      
      if (days) {
        dateFilter = ` AND selected_at >= NOW() - INTERVAL '${days} days'`;
      }
      
      const result = await client.query(`
        SELECT 
          mood,
          COUNT(*) as count,
          MAX(selected_at) as last_selected
        FROM mood_selections 
        WHERE user_id = $1 ${dateFilter}
        GROUP BY mood
        ORDER BY count DESC
      `, params);
      
      client.release();
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting user mood stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get all mood selections with user info (for admin/analytics)
  static async getAllMoodSelectionsWithUsers(limit?: number): Promise<QueryResult<any[]>> {
    try {
      const client = await pool.connect();
      
      let query = `
        SELECT 
          ms.id, ms.mood, ms.selected_at, ms.page,
          u.id as user_id, u.username, u.display_name
        FROM mood_selections ms
        JOIN users u ON ms.user_id = u.id
        ORDER BY ms.selected_at DESC
      `;
      
      const params: any[] = [];
      
      if (limit) {
        query += ` LIMIT $1`;
        params.push(limit);
      }
      
      const result = await client.query(query, params);
      client.release();
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting all mood selections with users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete mood selection by ID
  static async deleteMoodSelection(id: number): Promise<QueryResult<boolean>> {
    try {
      const client = await pool.connect();
      const result = await client.query('DELETE FROM mood_selections WHERE id = $1', [id]);
      client.release();
      
      if (result.rowCount === 0) {
        return {
          success: false,
          error: 'Mood selection not found'
        };
      }
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Error deleting mood selection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete all mood selections for a user
  static async deleteUserMoodSelections(userId: number): Promise<QueryResult<boolean>> {
    try {
      const client = await pool.connect();
      await client.query('DELETE FROM mood_selections WHERE user_id = $1', [userId]);
      client.release();
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('Error deleting user mood selections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check if user should show mood selector (no selection or last selection > 5 minutes ago)
  static async shouldShowMoodSelector(userId: number, page: string = 'main'): Promise<boolean> {
    try {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT selected_at 
        FROM mood_selections 
        WHERE user_id = $1 AND page = $2 
        ORDER BY selected_at DESC 
        LIMIT 1
      `, [userId, page]);
      client.release();
      
      // If no mood selection found, show the selector
      if (result.rows.length === 0) {
        return true;
      }
      
      // Check if last selection was more than 5 minutes ago
      const lastSelection = new Date(result.rows[0].selected_at);
      const now = new Date();
      const timeDifferenceMs = now.getTime() - lastSelection.getTime();
      const fiveMinutesMs = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      return timeDifferenceMs > fiveMinutesMs;
    } catch (error) {
      console.error('Error checking mood selector visibility:', error);
      return true; // Show on error to be safe
    }
  }
} 