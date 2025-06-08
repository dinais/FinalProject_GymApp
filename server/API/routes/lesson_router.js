const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lesson_controller');

router.get('/week', lessonController.getLessonsByWeek);

module.exports = router;
