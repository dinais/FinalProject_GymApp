// routes/lessons.js
const express = require('express');
const router = express.Router();
const lessonsController = require('../controllers/lesson_controller');
const { protect, authorizeRoles } = require('../middleware/auth_middleware'); // ודא נתיב נכון

// מסלולים נגישים לציבור (או מוגנים אם נדרש מאוחר יותר)
router.get('/week', lessonsController.getWeeklyLessons);
router.get('/user/:userId/registered', lessonsController.getUserRegisteredLessons);
router.get('/user/:userId/week', lessonsController.getUserLessonsThisWeek);
router.get('/user/:userId/waitlist', lessonsController.getUserWaitlistedLessons);
router.get('/registered_counts', lessonsController.getRegisteredCounts);

// אבטחת מסלולי הצטרפות וביטול עם middleware 'protect'
// ה-userId ייקח כעת מ-req.user.id בקונטרולר
router.post('/:lessonId/join', protect, lessonsController.joinLesson);
router.post('/:lessonId/cancel', protect, lessonsController.cancelLesson);

// *** חדש: מסלולים למזכירה (הוספה, עריכה, מחיקת שיעורים) ***
// מסלולים אלה דורשים אימות (Authentication) ושהמשתמש יהיה בעל תפקיד 'secretary' (Authorization)
router.post('/', protect, authorizeRoles('secretary'), lessonsController.addLesson);
router.put('/:lessonId', protect, authorizeRoles('secretary'), lessonsController.updateLesson);
router.delete('/:lessonId', protect, authorizeRoles('secretary'), lessonsController.deleteLesson);

module.exports = router;