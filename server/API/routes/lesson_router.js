const express = require('express');
const router = express.Router();
const lessonsController = require('../controllers/lesson_controller');
const { protect, authorizeRoles } = require('../middleware/auth_middleware'); 

// Publicly accessible routes (or protected if required later)
// getWeeklyLessons now needs 'protect' middleware to access req.user.id for favorite status
router.get('/week', protect, lessonsController.getWeeklyLessons); // ADDED protect

router.get('/user/:userId/registered', protect, lessonsController.getUserRegisteredLessons); // Ensure this is protected if userId comes from token
router.get('/user/:userId/week', protect, lessonsController.getUserLessonsThisWeek); // Ensure this is protected if userId comes from token
router.get('/user/:userId/waitlist', protect, lessonsController.getUserWaitlistedLessons); // Ensure this is protected if userId comes from token
router.get('/registered_counts', lessonsController.getRegisteredCounts);

// Secure join and cancel routes with 'protect' middleware
router.post('/:lessonId/join', protect, lessonsController.joinLesson);
router.post('/:lessonId/cancel', protect, lessonsController.cancelLesson);

// Secretary routes (add, edit, delete lessons)
router.post('/', protect, authorizeRoles('secretary'), lessonsController.addLesson);
router.put('/:lessonId', protect, authorizeRoles('secretary'), lessonsController.updateLesson);
router.delete('/:lessonId', protect, authorizeRoles('secretary'), lessonsController.deleteLesson);

// --- New: Favorite Routes for Clients ---
router.post('/:lessonId/favorite', protect, authorizeRoles('client'), lessonsController.addFavorite);
router.delete('/:lessonId/favorite', protect, authorizeRoles('client'), lessonsController.removeFavorite);
router.get('/user/favorites/week', protect, authorizeRoles('client'), lessonsController.getUserFavoriteLessons); // New route to get only favorite lessons for the week

module.exports = router;
