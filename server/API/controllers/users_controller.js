const user_manager = require('../../BL/user_manager'); // ודא שהנתיב נכון
const jwt = require('jsonwebtoken'); // נשאר לייבוא כי הוא משמש ב-refreshToken

// ודא שמשתני הסביבה זמינים כאן
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// הרשמת משתמש חדש
exports.registerUser = async (req, res) => {
    try {
        const userData = req.body;
        // שינוי: עכשיו מצפים ל-roleName במקום roleId
        // אם לא נשלח roleName, ניתן ברירת מחדל ל"client" (מתאמן)
        if (!userData.roleName) {
            userData.roleName = 'client'; // ברירת מחדל: מתאמן
            console.warn('roleName לא צוין ברישום, הוגדר כברירת מחדל: "client"');
        }

        const newUser = await user_manager.registerUser(userData);
        res.status(201).json({ message: 'המשתמש נרשם בהצלחה', user: newUser });
    } catch (err) {
        console.error('Error in registerUser:', err);
        // שגיאות ספציפיות מה-BL
        if (err.message.includes('קיים כבר')) {
            return res.status(409).json({ error: err.message });
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
            return res.status(401).json({ message: result.error });
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
        res.status(401).json({ message: err.message || 'Login failed' });
    }
};

// שליפת כל המשתמשים (נגיש רק למזכירה/אדמין דרך הראוטר)
exports.getAllUsers = async (req, res) => {
    try {
        // המידלוויר 'protect' כבר העלה את המשתמש המאומת ופרטיו (כולל תפקידים) ל-req.user.
        // אין צורך לבצע כאן בדיקת הרשאות נוספת, היא כבר נעשתה בראוטר.
        const users = await user_manager.getAllUsers();
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

        // לוגיקה לבדיקה האם המשתמש המבקש רשאי לצפות בפרופיל:
        // 1. אם המשתמש המבקש הוא מזכירה או אדמין - מורשה לראות כל פרופיל.
        // 2. אם המשתמש המבקש אינו מזכירה/אדמין, הוא מורשה לראות רק את הפרופיל של עצמו.
        if (!requestingUser.roles.includes('secretary') && !requestingUser.roles.includes('admin')) {
            if (requestingUser.id.toString() !== userId.toString()) { // השוואת ID (string vs. number)
                return res.status(403).json({ error: 'אין לך הרשאה לצפות בפרופיל של משתמש אחר.' });
            }
        }

        const user = await user_manager.getUserById(userId);
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
        const requestingUser = req.user; // המשתמש המאומת

        // אכיפת הרשאה: משתמש רגיל לא יכול לעדכן תפקידים או משתמשים אחרים.
        // מכיוון שהראוטר כבר מגביל את זה למזכירה/אדמין, אין צורך בבדיקת תפקידים מפורשת כאן
        // אלא אם כן תרצה לאפשר ללקוח לעדכן את הפרופיל שלו (ואז צריך להתאים את הראוטר)
        // אם מזכירה/אדמין מעדכנים את עצמם, הם יכולים לשנות הכל.

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

// מחיקת משתמש (נגיש רק למזכירה/אדמין דרך הראוטר)
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // המידלוויר 'authorizeRoles' בראוטר כבר מוודא שהמשתמש הוא מזכירה או אדמין.
        // ניתן להוסיף כאן לוגיקה למניעת מחיקת אדמין על ידי מזכירה אם תרצה.

        const deleted = await user_manager.deleteUser(userId);
        if (deleted) {
            res.json({ message: 'המשתמש נמחק בהצלחה' });
        } else {
            res.status(404).json({ error: 'משתמש לא נמצא' });
        }
    } catch (err) {
        console.error('Error in deleteUser:', err);
        res.status(500).json({ error: 'נכשל למחוק את המשתמש', details: err.message });
    }
};

// --- פונקציות חדשות עבור המזכירה ---

// שליפת מתאמנים בלבד (עבור המזכירה)
exports.getTrainees = async (req, res) => {
    try {
        // המידלוויר 'authorizeRoles('secretary')' בראוטר כבר מוודא שהמשתמש הוא מזכירה.
        // אין צורך בבדיקה נוספת כאן.
        const trainees = await user_manager.getUsersByRole('client');
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
        if (!token) return res.status(401).json({ error: 'אין רענון טוקן.' });

        // ודא שמשתמש הקיים ב-BL מוגדר לטיפול ברענון טוקן בצורה מאובטחת
        // זה עדיף על יצירת הטוקן ישירות כאן.
        const result = await user_manager.refreshAccessToken(token);

        if (!result.succeeded) {
            return res.status(403).json({ error: result.error });
        }

        const { accessToken, newRefreshToken } = result.data; // אם BL מייצר גם refreshToken חדש

        // אם נוצר refreshToken חדש, יש לעדכן את הקוקי
        if (newRefreshToken) {
             res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        }
       
        return res.json({ accessToken });
    } catch (err) {
        console.error('Error in refreshToken:', err);
        // טפל בשגיאות שונות (טוקן פג תוקף, טוקן לא חוקי וכו')
        if (err.message.includes('expired')) {
             return res.status(403).json({ error: 'רענון טוקן פג תוקף, אנא התחבר מחדש.' });
        }
        return res.status(403).json({ error: err.message || 'רענון טוקן לא תקין או כשל.' });
    }
};