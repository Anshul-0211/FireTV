"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationController = void 0;
const database_1 = require("../config/database");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
class RecommendationController {
    // GET /api/recommendations/:username - Get recommendations for a profile
    static async getRecommendations(req, res) {
        try {
            const { username } = req.params;
            const limit = parseInt(req.query.limit) || 30;
            if (!username) {
                res.status(400).json({
                    success: false,
                    error: 'Username is required'
                });
                return;
            }
            // Validate username against known profiles
            const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
            if (!validProfiles.includes(username)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid profile name'
                });
                return;
            }
            const tableName = `${username}_dash`;
            const query = `
        SELECT tmdb_id, title, genres, vote_average, popularity, 
               overview, poster_path, similarity_score, added_at
        FROM ${tableName} 
        WHERE is_active = TRUE 
        ORDER BY similarity_score DESC, added_at DESC 
        LIMIT $1
      `;
            const result = await database_1.pool.query(query, [limit]);
            res.status(200).json({
                success: true,
                data: {
                    profile: username,
                    recommendations: result.rows,
                    count: result.rows.length
                }
            });
        }
        catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // POST /api/recommendations/:username/refresh - Refresh recommendations for a profile
    static async refreshRecommendations(req, res) {
        try {
            const { username } = req.params;
            if (!username) {
                res.status(400).json({
                    success: false,
                    error: 'Username is required'
                });
                return;
            }
            // Validate username against known profiles
            const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
            if (!validProfiles.includes(username)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid profile name'
                });
                return;
            }
            // Call Python recommendation service
            const pythonScriptPath = path_1.default.join(__dirname, '../../../src4/firetv_integration.py');
            const pythonProcess = (0, child_process_1.spawn)('python3', [pythonScriptPath, 'refresh', username]);
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
                    });
                }
                else {
                    console.error('Python script error:', errorData);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to refresh recommendations'
                    });
                }
            });
        }
        catch (error) {
            console.error('Error refreshing recommendations:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // POST /api/recommendations/refresh-all - Refresh recommendations for all profiles
    static async refreshAllRecommendations(_req, res) {
        try {
            const profiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
            const results = {};
            // Call Python recommendation service for all profiles
            const pythonScriptPath = path_1.default.join(__dirname, '../../../src4/firetv_integration.py');
            const pythonProcess = (0, child_process_1.spawn)('python3', [pythonScriptPath, 'refresh-all']);
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
                    });
                }
                else {
                    console.error('Python script error:', errorData);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to refresh recommendations for all profiles'
                    });
                }
            });
        }
        catch (error) {
            console.error('Error refreshing all recommendations:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // GET /api/recommendations/:username/stats - Get recommendation statistics
    static async getRecommendationStats(req, res) {
        try {
            const { username } = req.params;
            if (!username) {
                res.status(400).json({
                    success: false,
                    error: 'Username is required'
                });
                return;
            }
            // Validate username
            const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
            if (!validProfiles.includes(username)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid profile name'
                });
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
          COUNT(DISTINCT unnest(genres)) as unique_genres
        FROM ${tableName} 
        WHERE is_active = TRUE
      `;
            const statsResult = await database_1.pool.query(statsQuery);
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
            const userResult = await database_1.pool.query(userQuery, [username]);
            if (userResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }
            const stats = {
                user: userResult.rows[0],
                recommendations: statsResult.rows[0]
            };
            res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error getting recommendation stats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // POST /api/recommendations/trigger-on-watch - Trigger recommendations when user watches a movie
    static async triggerOnWatch(req, res) {
        try {
            const { username, tmdb_id } = req.body;
            if (!username || !tmdb_id) {
                res.status(400).json({
                    success: false,
                    error: 'Username and tmdb_id are required'
                });
                return;
            }
            // Validate username
            const validProfiles = ['anshul', 'shikhar', 'priyanshu', 'shaurya'];
            if (!validProfiles.includes(username)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid profile name'
                });
                return;
            }
            // This endpoint is called when a user marks a movie as watched
            // It should trigger the recommendation engine to refresh recommendations
            console.log(`🎬 User ${username} watched movie ${tmdb_id}, triggering recommendation refresh`);
            // Call Python recommendation service asynchronously
            const pythonScriptPath = path_1.default.join(__dirname, '../../../src4/firetv_integration.py');
            const pythonProcess = (0, child_process_1.spawn)('python3', [pythonScriptPath, 'refresh', username]);
            // Don't wait for the process to complete, return immediately
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ Recommendations refreshed for ${username} after watching ${tmdb_id}`);
                }
                else {
                    console.error(`❌ Failed to refresh recommendations for ${username}`);
                }
            });
            res.status(200).json({
                success: true,
                message: 'Recommendation refresh triggered',
                data: { username, tmdb_id }
            });
        }
        catch (error) {
            console.error('Error triggering recommendation refresh:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}
exports.RecommendationController = RecommendationController;
//# sourceMappingURL=recommendationController.js.map