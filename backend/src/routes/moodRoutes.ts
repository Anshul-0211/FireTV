import { Router } from 'express';
import { MoodController } from '../controllers/moodController';

const router = Router();

// Mood selection routes
router.get('/user/:userId', MoodController.getUserMoodSelections);
router.get('/user/:userId/latest', MoodController.getLatestMoodSelection);
router.post('/user/:userId', MoodController.createOrUpdateMoodSelection);
router.get('/user/:userId/stats', MoodController.getUserMoodStats);
router.get('/user/:userId/should-show', MoodController.shouldShowMoodSelector);

// Page-specific routes
router.get('/page/:page', MoodController.getMoodSelectionsByPage);

// Admin/Analytics routes
router.get('/all', MoodController.getAllMoodSelectionsWithUsers);

// Delete routes
router.delete('/:id', MoodController.deleteMoodSelection);

export default router; 