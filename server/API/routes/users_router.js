// API/routes/users_router.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/users_controller');
const { protect, authorizeRoles } = require('../middleware/auth_middleware'); 

// ראוטים ללא הגנה (הרשמה, התחברות)
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/refresh-token', userController.refreshToken); // ראוט לרענון טוקן

// ראוטים הדורשים הגנה (כניסה למערכת)
router.use(protect); // כל הראוטים מתחת לשורה זו דורשים טוקן גישה תקף

// שליפת כל המשתמשים - רק למזכירה/אדמין
// ניתן להוסיף Query Paramter לשליפת לא פעילים: /api/users?includeInactive=true
router.get('/', authorizeRoles('secretary', 'admin'), userController.getAllUsers);

// שליפת משתמש לפי ID - מזכירה/אדמין יכולים לראות הכל, משתמש יכול לראות את עצמו
// ניתן להוסיף Query Paramter לשליפת לא פעילים: /api/users/:id?includeInactive=true
router.get('/:id', userController.getUserById);

// עדכון משתמש - רק למזכירה/אדמין (אם רוצים שמשתמשים יוכלו לעדכן את עצמם, צריך ראוט נפרד/לוגיקה ב-controller)
router.put('/:id', authorizeRoles('secretary', 'admin'), userController.updateUser);

// **שינוי: מחיקה רכה של משתמש - רק למזכירה/אדמין**
router.delete('/:id', authorizeRoles('secretary', 'admin'), userController.softDeleteUser);

// **ראוט חדש: הפעלת משתמש מחדש - רק למזכירה/אדמין**
router.put('/:id/activate', authorizeRoles('secretary', 'admin'), userController.activateUser);


// מסלולים ייעודיים עבור המזכירה
// שליפת מתאמנים בלבד - רק למזכירה
// ניתן להוסיף Query Paramter לשליפת לא פעילים: /api/users/secretary/role/client?includeInactive=true
router.get('/secretary/role/client', authorizeRoles('secretary'), userController.getTrainees);

// שליפת כל התפקידים - רק למזכירה/אדמין
router.get('/roles', authorizeRoles('secretary', 'admin'), userController.getAllRoles);


module.exports = router;