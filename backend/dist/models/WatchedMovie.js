"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchedMovieModel = void 0;
const database_1 = require("../config/database");
class WatchedMovieModel {
    // Get all watched movies for a user
    static async getUserWatchedMovies(userId, limit, offset) {
        try {
            const client = await database_1.pool.connect();
            let query = `
        SELECT id, user_id, movie_id, tmdb_id, title, watched_at, rating, current_mood, created_at, updated_at
        FROM watched_movies 
        WHERE user_id = $1 
        ORDER BY watched_at DESC
      `;
            const params = [userId];
            let paramCounter = 2;
            if (limit) {
                query += ` LIMIT $${paramCounter++}`;
                params.push(limit);
            }
            if (offset) {
                query += ` OFFSET $${paramCounter}`;
                params.push(offset);
            }
            const result = await client.query(query, params);
            client.release();
            return {
                success: true,
                data: result.rows
            };
        }
        catch (error) {
            console.error('Error getting user watched movies:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get watched status for a specific movie and user
    static async getWatchedStatus(userId, tmdbId) {
        try {
            const client = await database_1.pool.connect();
            const result = await client.query(`
        SELECT id, user_id, movie_id, tmdb_id, title, watched_at, rating, current_mood, created_at, updated_at
        FROM watched_movies 
        WHERE user_id = $1 AND tmdb_id = $2
      `, [userId, tmdbId]);
            client.release();
            return {
                success: true,
                data: result.rows.length > 0 ? result.rows[0] : null
            };
        }
        catch (error) {
            console.error('Error getting watched status:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Mark a movie as watched or update existing record
    static async markAsWatched(userId, watchedData) {
        try {
            const client = await database_1.pool.connect();
            // Use UPSERT to handle duplicate entries
            const result = await client.query(`
        INSERT INTO watched_movies (user_id, movie_id, tmdb_id, title, rating, current_mood, watched_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (user_id, tmdb_id)
        DO UPDATE SET 
          rating = EXCLUDED.rating,
          current_mood = EXCLUDED.current_mood,
          watched_at = NOW(),
          updated_at = NOW()
        RETURNING id, user_id, movie_id, tmdb_id, title, watched_at, rating, current_mood, created_at, updated_at
      `, [
                userId,
                watchedData.movie_id,
                watchedData.tmdb_id,
                watchedData.title,
                watchedData.rating,
                watchedData.current_mood || null
            ]);
            client.release();
            return {
                success: true,
                data: result.rows[0]
            };
        }
        catch (error) {
            console.error('Error marking movie as watched:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Update rating and/or mood for a watched movie
    static async updateWatchedMovie(userId, tmdbId, updateData) {
        try {
            // Build dynamic update query
            const updateFields = [];
            const values = [];
            let paramCounter = 1;
            if (updateData.rating !== undefined) {
                updateFields.push(`rating = $${paramCounter++}`);
                values.push(updateData.rating);
            }
            if (updateData.current_mood !== undefined) {
                updateFields.push(`current_mood = $${paramCounter++}`);
                values.push(updateData.current_mood);
            }
            if (updateFields.length === 0) {
                return {
                    success: false,
                    error: 'No fields to update'
                };
            }
            // Add WHERE clause parameters
            values.push(userId, tmdbId);
            const client = await database_1.pool.connect();
            const result = await client.query(`
        UPDATE watched_movies 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE user_id = $${paramCounter++} AND tmdb_id = $${paramCounter}
        RETURNING id, user_id, movie_id, tmdb_id, title, watched_at, rating, current_mood, created_at, updated_at
      `, values);
            client.release();
            if (result.rows.length === 0) {
                return {
                    success: false,
                    error: 'Watched movie not found'
                };
            }
            return {
                success: true,
                data: result.rows[0]
            };
        }
        catch (error) {
            console.error('Error updating watched movie:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Remove movie from watched list
    static async removeFromWatched(userId, tmdbId) {
        try {
            const client = await database_1.pool.connect();
            const result = await client.query('DELETE FROM watched_movies WHERE user_id = $1 AND tmdb_id = $2', [userId, tmdbId]);
            client.release();
            if (result.rowCount === 0) {
                return {
                    success: false,
                    error: 'Watched movie not found'
                };
            }
            return {
                success: true,
                data: true
            };
        }
        catch (error) {
            console.error('Error removing watched movie:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get user's movie statistics
    static async getUserMovieStats(userId) {
        try {
            const client = await database_1.pool.connect();
            const result = await client.query(`
        SELECT 
          COUNT(*) as total_movies,
          COUNT(CASE WHEN rating = 'loved' THEN 1 END) as loved_movies,
          COUNT(CASE WHEN rating = 'good' THEN 1 END) as good_movies,
          COUNT(CASE WHEN rating = 'disliked' THEN 1 END) as disliked_movies,
          AVG(CASE 
            WHEN rating = 'loved' THEN 3 
            WHEN rating = 'good' THEN 2 
            WHEN rating = 'disliked' THEN 1 
          END) as average_rating
        FROM watched_movies 
        WHERE user_id = $1
      `, [userId]);
            client.release();
            return {
                success: true,
                data: result.rows[0]
            };
        }
        catch (error) {
            console.error('Error getting user movie stats:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get movies watched by rating
    static async getMoviesByRating(userId, rating) {
        try {
            const client = await database_1.pool.connect();
            const result = await client.query(`
        SELECT id, user_id, movie_id, tmdb_id, title, watched_at, rating, current_mood, created_at, updated_at
        FROM watched_movies 
        WHERE user_id = $1 AND rating = $2 
        ORDER BY watched_at DESC
      `, [userId, rating]);
            client.release();
            return {
                success: true,
                data: result.rows
            };
        }
        catch (error) {
            console.error('Error getting movies by rating:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get movies watched in a specific mood
    static async getMoviesByMood(userId, mood) {
        try {
            const client = await database_1.pool.connect();
            const result = await client.query(`
        SELECT id, user_id, movie_id, tmdb_id, title, watched_at, rating, current_mood, created_at, updated_at
        FROM watched_movies 
        WHERE user_id = $1 AND current_mood = $2 
        ORDER BY watched_at DESC
      `, [userId, mood]);
            client.release();
            return {
                success: true,
                data: result.rows
            };
        }
        catch (error) {
            console.error('Error getting movies by mood:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get all watched movies with user info (for admin/analytics)
    static async getAllWatchedMoviesWithUsers(limit) {
        try {
            const client = await database_1.pool.connect();
            let query = `
        SELECT 
          wm.id, wm.tmdb_id, wm.title, wm.rating, wm.current_mood, wm.watched_at,
          u.id as user_id, u.username, u.display_name
        FROM watched_movies wm
        JOIN users u ON wm.user_id = u.id
        ORDER BY wm.watched_at DESC
      `;
            const params = [];
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
        }
        catch (error) {
            console.error('Error getting all watched movies with users:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get recently watched movies (across all users)
    static async getRecentlyWatchedMovies(limit = 10) {
        try {
            const client = await database_1.pool.connect();
            const result = await client.query(`
        SELECT 
          wm.tmdb_id, wm.title, wm.rating, wm.watched_at,
          u.username, u.display_name
        FROM watched_movies wm
        JOIN users u ON wm.user_id = u.id
        ORDER BY wm.watched_at DESC
        LIMIT $1
      `, [limit]);
            client.release();
            return {
                success: true,
                data: result.rows
            };
        }
        catch (error) {
            console.error('Error getting recently watched movies:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Delete all watched movies for a user
    static async deleteUserWatchedMovies(userId) {
        try {
            const client = await database_1.pool.connect();
            await client.query('DELETE FROM watched_movies WHERE user_id = $1', [userId]);
            client.release();
            return {
                success: true,
                data: true
            };
        }
        catch (error) {
            console.error('Error deleting user watched movies:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
exports.WatchedMovieModel = WatchedMovieModel;
//# sourceMappingURL=WatchedMovie.js.map