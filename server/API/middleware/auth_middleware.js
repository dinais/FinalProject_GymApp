// API/middleware/auth_middleware.js
const jwt = require('jsonwebtoken');
// ודא שהנתיב למודלים נכון מנקודת המבט של קובץ המידלוויר
const { user, role } = require('../../../DB/models');
// ודא שאתה מייבא את משתני הסביבה
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/**
 * מידלוויר לאימות טוקן, אחזור פרטי משתמש וטעינת התפקידים שלו מה-DB.
 * אם הטוקן תקין, המידע של המשתמש (כולל רשימת התפקידים שלו) יתווסף ל-req.user.
 *
 * @param {object} req - אובייקט הבקשה.
 * @param {object} res - אובייקט התגובה.
 * @param {function} next - פונקציית הקריאה הבאה בשרשרת המידלוויר.
 */
const protect = async (req, res, next) => {
    // נתיבים פתוחים שלא דורשים אימות טוקן.
    // שימו לב: אלו הנתיבים המלאים כפי שהם מגיעים לשרת (כולל /api/users אם זהו ה-prefix).
    const openPaths = [
        '/api/users/login',
        '/api/users/register',
        '/api/users/refresh-token'
    ];

    // אם הנתיב הנוכחי הוא אחד מהנתיבים הפתוחים, דלג על תהליך האימות והמשך הלאה.
    if (openPaths.includes(req.originalUrl)) {
        return next();
    }

    let token;
    // בדיקה אם טוקן קיים בכותרת Authorization (בפורמט Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // אם לא נמצא טוקן, החזר שגיאת 401 Unauthorized
    if (!token) {
        return res.status(401).json({ message: 'לא מורשה: אין טוקן גישה.' });
    }

    try {
        // אימות הטוקן באמצעות ה-secret.
        // השתמש ב-JWT_SECRET כסטנדרט, או TOKEN_SECRET אם זה השם שבו השתמשת בקובץ ה-.env שלך.
        const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.TOKEN_SECRET);

        // אחזור המשתמש מה-DB באמצעות ה-ID שפוענח מהטוקן.
        // כולל את התפקידים של המשתמש.
        const fullUser = await user.findByPk(decoded.id, {
            attributes: { exclude: ['password_hash'] }, // לא נחזיר את הסיסמה המגובבת מטעמי אבטחה
            include: [{
                model: role,
                as: 'roles', // חשוב: השם הזה חייב להתאים ל-as שהגדרת ב-associations במודלים שלך (בדרך כלל ב-DB/models/index.js)
                through: { attributes: [] }, // אל תכלול שדות מטבלת ה-join (user_roles)
                attributes: ['role'] // רק את שם התפקיד עצמו
            }]
        });

        // אם המשתמש לא נמצא בבסיס הנתונים (למרות שהטוקן היה תקין)
        if (!fullUser) {
            return res.status(401).json({ message: 'לא מורשה: משתמש לא נמצא בבסיס הנתונים.' });
        }

        // עדכן את אובייקט req.user עם פרטי המשתמש המלאים ורשימת תפקידיו.
        // ה-roles יהיה מערך של מחרוזות (לדוגמה: ['secretary', 'client']).
        req.user = {
            ...fullUser.toJSON(), // המר את אובייקט Sequelize לאובייקט JavaScript רגיל
            roles: fullUser.roles.map(r => r.role)
        };

        next(); // המשתמש מאומת ופרטיו נטענו, המשך למידלוויר/ראוטר הבא.

    } catch (error) {
        console.error('JWT Verification Error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'ההתחברות פגה: הטוקן פג תוקף, אנא רענן טוקן.' });
        }
        // שגיאה כללית בפענוח הטוקן (לדוגמה: טוקן לא תקין, חתימה לא נכונה)
        res.status(403).json({ message: 'לא מורשה: טוקן גישה לא תקין או כשל באימות.' });
    }
};

/**
 * מידלוויר לבדיקת הרשאות (תפקידים).
 * בודק אם למשתמש המאומת (שנמצא ב-req.user) יש אחד מהתפקידים המפורטים.
 *
 * @param {string[]} roles - רשימת התפקידים המורשים עבור המסלול הנוכחי.
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // ודא ש-req.user קיים, שיש לו שדה 'roles' ושהוא מערך,
        // ושלמשתמש יש לפחות אחד מהתפקידים המורשים.
        if (!req.user || !req.user.roles || !Array.isArray(req.user.roles) || !roles.some(role => req.user.roles.includes(role))) {
            return res.status(403).json({ message: 'אסור: אין לך הרשאה לבצע פעולה זו.' });
        }
        next(); // למשתמש יש את ההרשאות הנדרשות, המשך הלאה.
    };
};

module.exports = { protect, authorizeRoles };