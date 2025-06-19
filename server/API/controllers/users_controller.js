// api/controllers/users_controller.js
const user_manager = require('../../BL/user_manager');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// הרשמת משתמש חדש
exports.registerUser = async (req, res) => {
    try {
        const userData = req.body;
        if (!userData.roleName) {
            userData.roleName = 'client';
            console.warn('roleName לא צוין ברישום, הוגדר כברירת מחדל: "client"');
        }

        const newUser = await user_manager.registerUser(userData);

        if (newUser.isReactivated) {
            res.status(200).json({ message: 'המשתמש הופעל מחדש בהצלחה', user: newUser });
        } else {
            res.status(201).json({ message: 'המשתמש נרשם בהצלחה', user: newUser });
        }
    } catch (err) {
        console.error('Error in registerUser:', err);
        // שגיאות ספציפיות מה-BL
        if (err.message.includes('קיים כבר') && err.message.includes('פעיל')) {
            return res.status(409).json({ error: err.message }); // 409 Conflict
        }
        if (err.message.includes('תפקיד')) {
            return res.status(400).json({ error: err.message }); // 400 Bad Request
        }
        res.status(500).json({ error: 'נכשל לרשום את המשתמש', details: err.message });
    }
};

// כניסת משתמש
exports.loginUser = async (req, res) => {
    try {
        console.log("קיבלתי בקשה ל־/login");
        const { email, password } = req.body;
        const result = await user_manager.login({ email, password });

        if (!result.succeeded) {
            // טיפול בהודעת "החשבון אינו פעיל" בצורה ספציפית
            if (result.error.includes('אינו פעיל')) {
                return res.status(403).json({ message: result.error }); // 403 Forbidden
            }
            return res.status(401).json({ message: result.error }); // 401 Unauthorized
        }

        const { accessToken, refreshToken, user } = result.data;

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true ב-production (https), false בפיתוח
            sameSite: 'Lax', // או 'None' אם ה-frontend בדומין אחר עם secure:true
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ימים
        });

        res.json({ accessToken, user }); // החזר גם את ה-user ל־React אם צריך
    } catch (err) {
        console.error('Error in loginUser:', err);
        res.status(500).json({ message: err.message || 'Login failed' }); // שגיאת שרת כללית במקרה של תקלה לא צפויה
    }
};

// שליפת כל המשתמשים (נגיש רק למזכירה/אדמין דרך הראוטר)
exports.getAllUsers = async (req, res) => {
    try {
        // המידלוויר 'protect' כבר העלה את המשתמש המאומת ופרטיו (כולל תפקידים) ל-req.user.
        // אין צורך לבצע כאן בדיקת הרשאות נוספת, היא כבר נעשתה בראוטר.
        // NEW: קבלת פרמטר includeInactive מהקווארי, כברירת מחדל false (רק פעילים)
        const includeInactive = req.query.includeInactive === 'true'; // req.query מחזיר מחרוזת
        const users = await user_manager.getAllUsers(includeInactive);
        res.json(users);
    } catch (err) {
        console.error('Error in getAllUsers:', err);
        res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
};

// שליפת משתמש לפי ID
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const requestingUser = req.user; // המשתמש המאומת מהטוקן
        // NEW: קבלת פרמטר includeInactive מהקווארי, כברירת מחדל false (רק פעילים)
        const includeInactive = req.query.includeInactive === 'true';

        // לוגיקה לבדיקה האם המשתמש המבקש רשאי לצפות בפרופיל:
        // 1. אם המשתמש המבקש הוא מזכירה או אדמין - מורשה לראות כל פרופיל (כולל לא פעילים אם requested).
        // 2. אם המשתמש המבקש אינו מזכירה/אדמין, הוא מורשה לראות רק את הפרופיל של עצמו, ורק אם הוא פעיל.
        if (!requestingUser.roles.includes('secretary') && !requestingUser.roles.includes('admin')) {
            if (requestingUser.id.toString() !== userId.toString()) { // השוואת ID (string vs. number)
                return res.status(403).json({ error: 'אין לך הרשאה לצפות בפרופיל של משתמש אחר.' });
            }
        }

        const user = await user_manager.getUserById(userId, includeInactive);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'משתמש לא נמצא' });
        }
    } catch (err) {
        console.error('Error in getUserById:', err);
        res.status(500).json({ error: 'נכשל לשלוף את המשתמש', details: err.message });
    }
};

// עדכון משתמש (נגיש רק למזכירה/אדמין דרך הראוטר)
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        // המידלוויר 'authorizeRoles' כבר מטפל בהרשאות (מזכירה/אדמין).
        // אין צורך בבדיקות נוספות כאן.

        const updated = await user_manager.updateUser(userId, updateData);
        if (updated) {
            res.json({ message: 'המשתמש עודכן בהצלחה' });
        } else {
            res.status(404).json({ error: 'משתמש לא נמצא או לא היו שינויים' });
        }
    } catch (err) {
        console.error('Error in updateUser:', err);
        res.status(500).json({ error: 'נכשל לעדכן את המשתמש', details: err.message });
    }
};

// **שינוי: פונקציית מחיקה רכה (soft delete)**
exports.softDeleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // המידלוויר 'authorizeRoles' בראוטר כבר מוודא שהמשתמש הוא מזכירה או אדמין.
        // ניתן להוסיף כאן לוגיקה למניעת מחיקת אדמין על ידי מזכירה אם תרצה.

        const deactivated = await user_manager.softDeleteUser(userId);
        if (deactivated) {
            res.json({ message: 'המשתמש הושבת בהצלחה (מחיקה רכה)' });
        } else {
            res.status(404).json({ error: 'משתמש לא נמצא או כבר אינו פעיל' });
        }
    } catch (err) {
        console.error('Error in softDeleteUser:', err);
        res.status(500).json({ error: 'נכשל להשבית את המשתמש', details: err.message });
    }
};

// **פונקציה חדשה: הפעלת משתמש מחדש**
exports.activateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // המידלוויר 'authorizeRoles' בראוטר כבר מוודא שהמשתמש הוא מזכירה או אדמין.

        const activated = await user_manager.activateUser(userId);
        if (activated) {
            res.json({ message: 'המשתמש הופעל מחדש בהצלחה' });
        } else {
            res.status(404).json({ error: 'משתמש לא נמצא או כבר פעיל' });
        }
    } catch (err) {
        console.error('Error in activateUser:', err);
        res.status(500).json({ error: 'נכשל להפעיל את המשתמש מחדש', details: err.message });
    }
};


// שליפת מתאמנים בלבד (עבור המזכירה)
exports.getTrainees = async (req, res) => {
    try {
        // המידלוויר 'authorizeRoles('secretary')' בראוטר כבר מוודא שהמשתמש הוא מזכירה.
        // אין צורך בבדיקה נוספת כאן.
        // NEW: קבלת פרמטר includeInactive מהקווארי
        const includeInactive = req.query.includeInactive === 'true';
        const trainees = await user_manager.getUsersByRole('client', includeInactive);
        res.json(trainees);
    } catch (err) {
        console.error('Error in getTrainees:', err);
        res.status(500).json({ error: 'נכשל לשלוף את רשימת המתאמנים', details: err.message });
    }
};

// שליפת כל התפקידים (עבור המזכירה/אדמין לצורך ניהול)
exports.getAllRoles = async (req, res) => {
    try {
        // המידלוויר 'authorizeRoles('secretary', 'admin')' בראוטר כבר מוודא הרשאה.
        const roles = await user_manager.getAllRoles();
        res.json(roles);
    } catch (err) {
        console.error('Error in getAllRoles:', err);
        res.status(500).json({ error: 'נכשל לשלוף את רשימת התפקידים', details: err.message });
    }
};

// רענון טוקן גישה
exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            console.warn('Refresh token missing from cookies.');
            return res.status(401).json({ error: 'אין רענון טוקן.' });
        }

        const result = await user_manager.refreshAccessToken(token);

        if (!result.succeeded) {
            // טיפול בהודעה ספציפית אם המשתמש לא פעיל, או שטוקן פג תוקף
            if (result.error.includes('אינו פעיל') || result.error.includes('פג תוקף')) {
                 // ננקה את הקוקי במקרה של טוקן פג תוקף/לא פעיל כדי למנוע ניסיונות חוזרים
                res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
                return res.status(403).json({ error: result.error }); // 403 Forbidden
            }
            return res.status(403).json({ error: result.error || 'רענון טוקן לא תקין או כשל.' }); // 403 Forbidden
        }

        const { accessToken } = result.data; // ה-BL לא מחזיר newRefreshToken כרגע, אז נוריד אותו מ-destructuring
                                             // אם user_manager.refreshAccessToken יוחזר newRefreshToken, יש להוסיף אותו כאן.

        // אם נוצר refreshToken חדש, יש לעדכן את הקוקי - כרגע ה-BL לא מייצר חדש, אז השארנו את הקוד מוקומנט.
        // if (newRefreshToken) {
        //     res.cookie('refreshToken', newRefreshToken, {
        //         httpOnly: true,
        //         secure: process.env.NODE_ENV === 'production',
        //         sameSite: 'Lax',
        //         maxAge: 7 * 24 * 60 * 60 * 1000
        //     });
        // }

        return res.json({ accessToken });
    } catch (err) {
        console.error('Error in refreshToken:', err);
        // טפל בשגיאות שונות (טוקן פג תוקף, טוקן לא חוקי וכו')
        if (err.name === 'TokenExpiredError') { // שם שגיאה ספציפי מ-jsonwebtoken
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
            return res.status(403).json({ error: 'רענון טוקן פג תוקף, אנא התחבר מחדש.' });
        }
        if (err.name === 'JsonWebTokenError') { // טוקן לא חוקי (signature)
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
            return res.status(403).json({ error: 'רענון טוקן לא חוקי.' });
        }
        return res.status(500).json({ error: err.message || 'שגיאה פנימית בשרת בעת רענון טוקן.' });
    }
};