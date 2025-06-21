"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recommendationController_1 = require("../controllers/recommendationController");
const router = (0, express_1.Router)();
// GET /api/recommendations/:username - Get recommendations for a profile
router.get('/:username', recommendationController_1.RecommendationController.getRecommendations);
// POST /api/recommendations/:username/refresh - Refresh recommendations for a profile
router.post('/:username/refresh', recommendationController_1.RecommendationController.refreshRecommendations);
// POST /api/recommendations/refresh-all - Refresh recommendations for all profiles
router.post('/refresh-all', recommendationController_1.RecommendationController.refreshAllRecommendations);
// GET /api/recommendations/:username/stats - Get recommendation statistics
router.get('/:username/stats', recommendationController_1.RecommendationController.getRecommendationStats);
// POST /api/recommendations/trigger-on-watch - Trigger recommendations when user watches a movie
router.post('/trigger-on-watch', recommendationController_1.RecommendationController.triggerOnWatch);
exports.default = router;
//# sourceMappingURL=recommendationRoutes.js.map