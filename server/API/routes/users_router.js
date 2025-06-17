// API/routes/users_router.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/users_controller');
// ייבוא המידלווירים מהקובץ המעודכן והיחיד שלך
const { protect, authorizeRoles } = require('../middleware/auth_middleware'); 

// --- מסלולים ללא הגנה (Authentication / Token Generation) ---
// מסלולים אלו לא צריכים את המידלוויר 'protect' באופן ספציפי כאן,
// מכיוון שהוא מופעל גלובלית ב-app.js (ראה סעיף הבא)
// והלוגיקה הפנימית שלו כבר תדלג עליהם באמצעות ה-openPaths.
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/refresh-token', userController.refreshToken);

// --- מסלולים מוגנים על ידי אימות והרשאות ---
// עבור מסלולים אלו, המידלוויר 'protect' (שהוגדר כגלובלי ב-app.js) ירוץ קודם.
// לאחר מכן, 'authorizeRoles' יבצע את בדיקת התפקידים הספציפית.
// (אין צורך להוסיף את 'protect' כאן שוב אם הוא מופעל גלובלית, אבל זה לא יזיק)

// שליפת כל התפקידים האפשריים במערכת
// router.get('/roles', protect, authorizeRoles('secretary', 'admin'), userController.getAllRoles);

// שליפת כל המשתמשים
router.get('/', protect, authorizeRoles('secretary', 'admin'), userController.getAllUsers);

// שליפת משתמש לפי ID
// 'client' ו-'coach' יכולים לגשת למידע של עצמם (דרושה לוגיקת בדיקת ID ב-controller עצמו)
// 'secretary' ו-'admin' יכולים לגשת לכל משתמש
router.get('/:id', protect, authorizeRoles('secretary', 'admin', 'client', 'coach'), userController.getUserById);

// עדכון משתמש
// רק 'secretary' ו-'admin' יכולים לעדכן משתמשים (כולל את עצמם)
router.put('/:id', protect, authorizeRoles('secretary', 'admin'), userController.updateUser);

// מחיקת משתמש
// רק 'secretary' ו-'admin' יכולים למחוק משתמשים
router.delete('/:id', protect, authorizeRoles('secretary', 'admin'), userController.deleteUser);

// מסלול ייעודי לקבלת מתאמנים בלבד (עבור המזכירה)
// רק 'secretary' יכולה לגשת למסלול זה
router.get('/secretary/role/client', protect, authorizeRoles('secretary'), userController.getTrainees);

module.exports = router;