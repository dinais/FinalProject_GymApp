const lessonManager = require('../../BL/lesson_manager');

// Existing functions...

exports.getWeeklyLessons = async (req, res) => {
    const weekStart = req.query.weekStart;
    const userId = req.user ? req.user.id : null; // Get userId from authenticated user if available
    try {
        const lessons = await lessonManager.getLessonsForWeek(weekStart, userId); // Pass userId
        res.json(lessons);
    } catch (error) {
        console.error('Error in getWeeklyLessons:', error);
        res.status(500).json({ error: 'Failed to fetch weekly lessons.' });
    }
};

exports.getUserRegisteredLessons = async (req, res) => {
    const { userId } = req.params; // This userId should come from req.user.id for authenticated requests
    const weekStart = req.query.weekStart;
    try {
        const lessons = await lessonManager.getUserRegisteredAndWaitlistedLessons(userId, weekStart);
        res.json(lessons);
    } catch (err) {
        console.error('Error fetching user registered and waitlisted lessons:', err);
        res.status(500).json({ error: 'Failed to fetch user lessons' });
    }
};

exports.getUserLessonsThisWeek = async (req, res) => {
    console.log(`Fetching lessons for user ${req.params.userId} starting week ${req.query.weekStart}`);
    
    const { userId } = req.params;
    const weekStart = req.query.weekStart;
    try {
        const lessons = await lessonManager.getUserLessons(userId, weekStart);
        res.json(lessons);
    } catch (error) {
        console.error('Error in getUserLessonsThisWeek:', error);
        res.status(500).json({ error: 'Failed to fetch user lessons for week.' });
    }
};

exports.getUserWaitlistedLessons = async (req, res) => {
    const { userId } = req.params;
    const weekStart = req.query.weekStart;
    console.log(`Fetching waitlisted lessons for user ${userId} starting from ${weekStart}`);
    
    try {
        const lessons = await lessonManager.getUserWaitlistedLessons(userId, weekStart);
        res.json(lessons);
    } catch (error) {
        console.error('Error in getUserWaitlistedLessons:', error);
        res.status(500).json({ error: 'Failed to fetch user waitlisted lessons.' });
    }
};

exports.getRegisteredCounts = async (req, res) => {
    const weekStart = req.query.weekStart;
    try {
        const counts = await lessonManager.getRegisteredCounts(weekStart);
        res.json({ succeeded: true, data: counts });
    } catch (error) {
        console.error('Error in getRegisteredCounts:', error);
        res.status(500).json({ succeeded: false, error: 'Failed to fetch registered counts.' });
    }
};

exports.joinLesson = async (req, res) => {
    const userId = req.user.id; // User ID from authenticated token
    const lessonId = parseInt(req.params.lessonId);

    console.log(`User ${userId} (from token) attempting to join lesson ${lessonId}`);

    try {
        const result = await lessonManager.joinLesson(userId, lessonId);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error in joinLesson:', err);
        res.status(400).json({ error: err.message });
    }
};

exports.cancelLesson = async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id; // User ID from authenticated token
    
    console.log(`User ${userId} (from token) attempting to cancel lesson ${lessonId}`);

    try {
        const result = await lessonManager.cancelLesson(userId, lessonId);
        res.json(result);
    } catch (err) {
        console.error('Error in cancelLesson:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.addLesson = async (req, res) => {
    try {
        const newLessonData = req.body;
        console.log('Secretary adding new lesson:', newLessonData);
        const lesson = await lessonManager.addLesson(newLessonData);
        res.status(201).json({ message: 'Lesson added successfully', lesson });
    } catch (err) {
        console.error('Error adding lesson:', err);
        res.status(400).json({ error: err.message || 'Failed to add lesson' });
    }
};

exports.updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const updatedLessonData = req.body;
        console.log(`Secretary updating lesson ${lessonId}:`, updatedLessonData);
        const result = await lessonManager.updateLesson(lessonId, updatedLessonData);
        if (!result) { 
            return res.status(404).json({ message: 'Lesson not found or no changes made.' });
        }
        res.status(200).json({ message: 'Lesson updated successfully', updatedLesson: result });
    } catch (err) {
        console.error('Error updating lesson:', err);
        res.status(400).json({ error: err.message || 'Failed to update lesson' });
    }
};

exports.deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        console.log(`Secretary deleting lesson ${lessonId}`);
        const result = await lessonManager.deleteLesson(lessonId);
        if (!result) { 
            return res.status(404).json({ message: 'Lesson not found.' });
        }
        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (err) {
        console.error('Error deleting lesson:', err);
        res.status(400).json({ error: err.message || 'Failed to delete lesson' });
    }
};

// --- New Favorite Controller Functions ---
exports.addFavorite = async (req, res) => {
    const userId = req.user.id;
    const lessonId = parseInt(req.params.lessonId);
    try {
        const result = await lessonManager.addFavoriteLesson(userId, lessonId);
        res.status(201).json({ succeeded: true, data: result });
    } catch (err) {
        console.error('Error adding favorite:', err);
        res.status(400).json({ succeeded: false, error: err.message || 'Failed to add favorite' });
    }
};

exports.removeFavorite = async (req, res) => {
    const userId = req.user.id;
    const lessonId = parseInt(req.params.lessonId);
    try {
        const result = await lessonManager.removeFavoriteLesson(userId, lessonId);
        res.status(200).json({ succeeded: true, data: result });
    } catch (err) {
        console.error('Error removing favorite:', err);
        res.status(400).json({ succeeded: false, error: err.message || 'Failed to remove favorite' });
    }
};

exports.getUserFavoriteLessons = async (req, res) => {
    const userId = req.user.id; // Get userId from authenticated token
    console.log(`Fetching favorite lessons for user ${userId} starting from week ${req.query.weekStart}`);
    
    const weekStart = req.query.weekStart;
    try {
        const lessons = await lessonManager.getFavoriteLessonsForUser(userId, weekStart);
        res.json({ succeeded: true, data: lessons });
    } catch (err) {
        console.error('Error fetching user favorite lessons:', err);
        res.status(500).json({ succeeded: false, error: err.message || 'Failed to fetch favorite lessons' });
    }
};
