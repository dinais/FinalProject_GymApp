const express = require('express');
const router = express.Router();
const lessonsController = require('../controllers/lesson_controller');
const { protect, authorizeRoles } = require('../middleware/auth_middleware'); 

router.get('/week', protect, lessonsController.getWeeklyLessons); 
router.get('/user/:userId/registered', protect, lessonsController.getUserRegisteredLessons); 
router.get('/user/:userId/week', protect, lessonsController.getUserLessonsThisWeek); 
router.get('/user/:userId/waitlist', protect, lessonsController.getUserWaitlistedLessons); 
router.get('/registered_counts', lessonsController.getRegisteredCounts);

router.post('/:lessonId/join', protect, lessonsController.joinLesson);
router.post('/:lessonId/cancel', protect, lessonsController.cancelLesson);
router.post('/', protect, authorizeRoles('secretary'), lessonsController.addLesson);

router.put('/:lessonId', protect, authorizeRoles('secretary'), lessonsController.updateLesson);

router.delete('/:lessonId', protect, authorizeRoles('secretary'), lessonsController.deleteLesson);

router.post('/:lessonId/favorite', protect, authorizeRoles('client'), lessonsController.addFavorite);
router.delete('/:lessonId/favorite', protect, authorizeRoles('client'), lessonsController.removeFavorite);
router.get('/user/favorites-by-week', protect, authorizeRoles('client'), lessonsController.getUserFavoriteLessons); 
module.exports = router;
