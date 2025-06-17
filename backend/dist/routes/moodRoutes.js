"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const moodController_1 = require("../controllers/moodController");
const router = (0, express_1.Router)();
// Mood selection routes
router.get('/user/:userId', moodController_1.MoodController.getUserMoodSelections);
router.get('/user/:userId/latest', moodController_1.MoodController.getLatestMoodSelection);
router.post('/user/:userId', moodController_1.MoodController.createOrUpdateMoodSelection);
router.get('/user/:userId/stats', moodController_1.MoodController.getUserMoodStats);
router.get('/user/:userId/should-show', moodController_1.MoodController.shouldShowMoodSelector);
// Page-specific routes
router.get('/page/:page', moodController_1.MoodController.getMoodSelectionsByPage);
// Admin/Analytics routes
router.get('/all', moodController_1.MoodController.getAllMoodSelectionsWithUsers);
// Delete routes
router.delete('/:id', moodController_1.MoodController.deleteMoodSelection);
exports.default = router;
//# sourceMappingURL=moodRoutes.js.map