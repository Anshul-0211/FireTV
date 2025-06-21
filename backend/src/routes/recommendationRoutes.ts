import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';

const router = Router();

// GET /api/recommendations/:username - Get recommendations for a profile
router.get('/:username', RecommendationController.getRecommendations);

// POST /api/recommendations/:username/refresh - Refresh recommendations for a profile
router.post('/:username/refresh', RecommendationController.refreshRecommendations);

// POST /api/recommendations/refresh-all - Refresh recommendations for all profiles
router.post('/refresh-all', RecommendationController.refreshAllRecommendations);

// GET /api/recommendations/:username/stats - Get recommendation statistics
router.get('/:username/stats', RecommendationController.getRecommendationStats);

// POST /api/recommendations/trigger-on-watch - Trigger recommendations when user watches a movie
router.post('/trigger-on-watch', RecommendationController.triggerOnWatch);

// NEW INCREMENTAL ROUTES
// POST /api/recommendations/:username/add-incremental - Add 5 new movies when user watches
router.post('/:username/add-incremental', RecommendationController.addIncrementalRecommendations);

// POST /api/recommendations/:username/dislike - Handle movie dislike
router.post('/:username/dislike', RecommendationController.handleMovieDislike);

// GET /api/recommendations/:username/profile-stats - Get profile growth statistics
router.get('/:username/profile-stats', RecommendationController.getProfileStats);

export default router; 