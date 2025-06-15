const lessonManager = require('../../BL/lesson_manager');

exports.getWeeklyLessons = async (req, res) => {
  const weekStart = req.query.weekStart;
  const lessons = await lessonManager.getLessonsForWeek(weekStart);
  res.json(lessons);
};

exports.getUserLessonsThisWeek = async (req, res) => {
  const { userId } = req.params;
  const weekStart = req.query.weekStart;
  const lessons = await lessonManager.getUserLessons(userId, weekStart);
  res.json(lessons);
};

exports.getUserWaitlistedLessons = async (req, res) => {
  const { userId } = req.params;
  const weekStart = req.query.weekStart;
  const lessons = await lessonManager.getUserWaitlistedLessons(userId, weekStart);
  res.json(lessons);
};

exports.getRegisteredCounts = async (req, res) => {
  const weekStart = req.query.weekStart;
  const counts = await lessonManager.getRegisteredCounts(weekStart);
  res.json(counts);
};


exports.joinLesson = async (req, res) => {
  console.log(`Joining lesson ${req.params.lessonId} for user ${req.body.userId}`);
  console.log('BODY:', req.body);
console.log('PARAMS:', req.params);

  const userId = parseInt(req.body.userId); // או מ-token אם יש auth
  const lessonId = parseInt(req.params.lessonId);

  try {
    const result = await lessonManager.joinLesson(userId, lessonId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.cancelLesson = async (req, res) => {
  const { lessonId } = req.params;
  const { userId } = req.body;
  const result = await lessonManager.cancelLesson(userId, lessonId);
  res.json(result);
};
