const express = require('express');
const router = express.Router();
const lessonsController = require('../controllers/lesson_controller');

router.get('/week', lessonsController.getWeeklyLessons);
// *** Route חדש עבור "השיעורים שלי" ***
router.get('/user/:userId/registered', lessonsController.getUserRegisteredLessons);
router.get('/user/:userId/week', lessonsController.getUserLessonsThisWeek);
router.get('/user/:userId/waitlist', lessonsController.getUserWaitlistedLessons);
router.get('/registered_counts', lessonsController.getRegisteredCounts);

router.post('/:lessonId/join', lessonsController.joinLesson);
router.post('/:lessonId/cancel', lessonsController.cancelLesson);

module.exports = router;