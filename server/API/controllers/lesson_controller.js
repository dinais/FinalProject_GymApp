const lessonManager = require('../../BL/lesson_manager');

exports.getWeeklyLessons = async (req, res) => {
    const weekStart = req.query.weekStart;
    try {
        const lessons = await lessonManager.getLessonsForWeek(weekStart);
        res.json(lessons);
    } catch (error) {
        console.error('שגיאה ב-getWeeklyLessons:', error);
        res.status(500).json({ error: 'נכשל שליפת שיעורים שבועיים.' });
    }
};

// *** פונקציה עבור "השיעורים שלי" ***
exports.getUserRegisteredLessons = async (req, res) => {
    const { userId } = req.params;
    const weekStart = req.query.weekStart;
    try {
        const lessons = await lessonManager.getUserRegisteredAndWaitlistedLessons(userId, weekStart);
        res.json(lessons);
    } catch (err) {
        console.error('שגיאה בשליפת שיעורים רשומים וממתינים למשתמש:', err);
        res.status(500).json({ error: 'נכשל שליפת שיעורי משתמש' });
    }
};

exports.getUserLessonsThisWeek = async (req, res) => {
    console.log(`שולף שיעורים למשתמש ${req.params.userId} החל מהשבוע ${req.query.weekStart}`);
    
    const { userId } = req.params;
    const weekStart = req.query.weekStart;
    try {
        const lessons = await lessonManager.getUserLessons(userId, weekStart);
        res.json(lessons);
    } catch (error) {
        console.error('שגיאה ב-getUserLessonsThisWeek:', error);
        res.status(500).json({ error: 'נכשל שליפת שיעורי משתמש לשבוע.' });
    }
};

exports.getUserWaitlistedLessons = async (req, res) => {
    const { userId } = req.params;
    const weekStart = req.query.weekStart;
    console.log(`שולף שיעורים ברשימת המתנה למשתמש ${userId} החל מ-${weekStart}`);
    
    try {
        const lessons = await lessonManager.getUserWaitlistedLessons(userId, weekStart);
        res.json(lessons);
    } catch (error) {
        console.error('שגיאה ב-getUserWaitlistedLessons:', error);
        res.status(500).json({ error: 'נכשל שליפת שיעורים ברשימת המתנה למשתמש.' });
    }
};

exports.getRegisteredCounts = async (req, res) => {
    const weekStart = req.query.weekStart;
    try {
        const counts = await lessonManager.getRegisteredCounts(weekStart);
        res.json(counts);
    } catch (error) {
        console.error('שגיאה ב-getRegisteredCounts:', error);
        res.status(500).json({ error: 'נכשל שליפת ספירת רשומים.' });
    }
};

// *** שונה: joinLesson כדי להשתמש ב-req.user.id לצורך אבטחה ***
exports.joinLesson = async (req, res) => {
    // ה-userId נלקח כעת מהטוקן המאומת דרך req.user.id
    const userId = req.user.id; 
    const lessonId = parseInt(req.params.lessonId);

    console.log(`משתמש ${userId} (מהטוקן) מנסה להצטרף לשיעור ${lessonId}`);

    try {
        const result = await lessonManager.joinLesson(userId, lessonId);
        res.status(200).json(result);
    } catch (err) {
        console.error('שגיאה ב-joinLesson:', err);
        res.status(400).json({ error: err.message });
    }
};

// *** שונה: cancelLesson כדי להשתמש ב-req.user.id לצורך אבטחה ***
exports.cancelLesson = async (req, res) => {
    const { lessonId } = req.params;
    // ה-userId נלקח כעת מהטוקן המאומת דרך req.user.id
    const userId = req.user.id; 
    
    console.log(`משתמש ${userId} (מהטוקן) מנסה לבטל שיעור ${lessonId}`);

    try {
        const result = await lessonManager.cancelLesson(userId, lessonId);
        res.json(result);
    } catch (err) {
        console.error('שגיאה ב-cancelLesson:', err);
        res.status(500).json({ error: err.message });
    }
};

// *** חדש: הוספת שיעור למזכירה ***
exports.addLesson = async (req, res) => {
    try {
        const newLessonData = req.body;
        // אופציונלי, ניתן לרשום איזה מזכירה הוסיפה את השיעור:
        // const secretaryId = req.user.id; 
        console.log('מזכירה מוסיפה שיעור חדש:', newLessonData);
        const lesson = await lessonManager.addLesson(newLessonData);
        res.status(201).json({ message: 'השיעור נוסף בהצלחה', lesson });
    } catch (err) {
        console.error('שגיאה בהוספת שיעור:', err);
        res.status(400).json({ error: err.message || 'נכשל בהוספת שיעור' });
    }
};

// *** חדש: עדכון שיעור למזכירה ***
exports.updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const updatedLessonData = req.body;
        console.log(`מזכירה מעדכנת שיעור ${lessonId}:`, updatedLessonData);
        const result = await lessonManager.updateLesson(lessonId, updatedLessonData);
        if (!result) { // בהנחה ש-updateLesson מחזיר null או false אם לא נמצא/עודכן
            return res.status(404).json({ message: 'השיעור לא נמצא או לא בוצעו שינויים.' });
        }
        res.status(200).json({ message: 'השיעור עודכן בהצלחה', updatedLesson: result });
    } catch (err) {
        console.error('שגיאה בעדכון שיעור:', err);
        res.status(400).json({ error: err.message || 'נכשל בעדכון שיעור' });
    }
};

// *** חדש: מחיקת שיעור למזכירה ***
exports.deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        console.log(`מזכירה מוחקת שיעור ${lessonId}`);
        const result = await lessonManager.deleteLesson(lessonId);
        if (!result) { // בהנחה ש-deleteLesson מחזיר false אם לא נמצא/נמחק
            return res.status(404).json({ message: 'השיעור לא נמצא.' });
        }
        res.status(200).json({ message: 'השיעור נמחק בהצלחה' });
    } catch (err) {
        console.error('שגיאה במחיקת שיעור:', err);
        res.status(400).json({ error: err.message || 'נכשל במחיקת שיעור' });
    }
};