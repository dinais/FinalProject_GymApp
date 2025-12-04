// api/controllers/users_controller.js
const user_manager = require('../../BL/user_manager');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
exports.registerUser = async (req, res) => {
    console.log('--- Debugging registerUser Controller ---');
    console.log('Request body received in controller:', JSON.stringify(req.body, null, 2));

    try {
        const userData = req.body;
        
        let actualRoleName = null;

        if (userData.roleName) { 
            actualRoleName = userData.roleName;
        } else if (userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
            actualRoleName = userData.roles[0];
        } 
 
        if (!actualRoleName) {
            console.warn('role (roleName or roles array) is missing or empty.');
            return res.status(400).json({ error: 'חובה לציין את התפקיד עבור המשתמש החדש (roleName או roles).' });
        }
        userData.roleName = actualRoleName; 

        const newUserResult = await user_manager.registerUser(userData);

        if (newUserResult.isExistingUserUpdated) {
            console.log('Existing user updated. Responding with 200.');
            res.status(200).json({ message: newUserResult.message, user: newUserResult });
        } else {
            console.log('New user created. Responding with 201.');
            res.status(201).json({ message: newUserResult.message, user: newUserResult });
        }
    } catch (err) {
        console.error('🚨 Error caught in registerUser Controller:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        
        let statusCode = 500;
        let errorMessage = 'שגיאה פנימית בשרת בעת רישום משתמש.';

        if (err.name === 'SequelizeUniqueConstraintError') {
            statusCode = 400;
            const field = err.errors && err.errors.length > 0 ? err.errors[0].path : 'שדה כלשהו';
            errorMessage = `שגיאת רישום: ${field} כבר קיים במערכת.`;
        } else if (err.name === 'SequelizeValidationError') {
            statusCode = 400;
            errorMessage = `שגיאת אימות נתונים: ${err.message}`;
        } else if (err.message.includes('תפקיד') || err.message.includes('כבר קיים')) {
            statusCode = 400;
            errorMessage = err.message;
        } else {
            errorMessage = err.message || errorMessage;
        }

        res.status(statusCode).json({ error: errorMessage, details: err.message });
    } finally {
        console.log('--- End registerUser Controller Debug ---');
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await user_manager.login({ email, password });

        if (!result.succeeded) {
            if (result.error.includes('אינו פעיל') || result.error.includes('אין לך תפקידים פעילים')) {
                return res.status(403).json({ message: result.error }); 
            }
            if (result.error.includes('הוגדרה סיסמה') || result.error.includes('אימייל או סיסמה שגויים')) {
                return res.status(401).json({ message: result.error });
            }
            return res.status(400).json({ message: result.error }); 
        }

        const { accessToken, refreshToken, user } = result.data;

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Lax', 
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        res.json({ accessToken, user }); 
    } catch (err) {
        console.error('Error in loginUser:', err);
        res.status(500).json({ message: err.message || 'Login failed' }); 
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const users = await user_manager.getAllUsers(includeInactive);
        res.json(users);
    } catch (err) {
        console.error('Error in getAllUsers:', err);
        res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const requestingUser = req.user; // המשתמש המאומת מהטוקן
        const includeInactive = req.query.includeInactive === 'true';

        // לוגיקה לבדיקה האם המשתמש המבקש רשאי לצפות בפרופיל:
        // 1. אם המשתמש המבקש הוא מזכירה או אדמין - מורשה לראות כל פרופיל (כולל לא פעילים אם requested).
        // 2. אם המשתמש המבקש אינו מזכירה/אדמין, הוא מורשה לראות רק את הפרופיל של עצמו.
        //    הבדיקה האם המשתמש פעיל כבר נעשית ב-BL (getUserById יחזיר null אם לא פעיל ולא includeInactive).
        if (!requestingUser.roles.includes('secretary') && !requestingUser.roles.includes('admin')) {
            if (requestingUser.id.toString() !== userId.toString()) { // השוואת ID (string vs. number)
                return res.status(403).json({ error: 'אין לך הרשאה לצפות בפרופיל של משתמש אחר.' });
            }
            // אם זה הפרופיל של עצמו, ו-includeInactive הוא true, עדיין נשלוף אותו.
            // ה-BL כבר מטפל בזה, אז פשוט נקרא לו עם includeInactive.
        }

        const user = await user_manager.getUserById(userId, includeInactive);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'משתמש לא נמצא או אינו פעיל.' }); // עדכון הודעה
        }
    } catch (err) {
        console.error('Error in getUserById:', err);
        res.status(500).json({ error: 'נכשל לשלוף את המשתמש', details: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;

        const updated = await user_manager.updateUser(userId, updateData);
        if (updated) {
            res.json({ message: 'המשתמש עודכן בהצלחה' });
        } else {
            res.status(404).json({ error: 'משתמש לא נמצא או לא היו שינויים' });
        }
    } catch (err) {
        console.error('Error in updateUser:', err);
        if (err.message.includes('תפקיד')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'נכשל לעדכן את המשתמש', details: err.message });
    }
};

exports.softDeleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { roleName } = req.query; 

        console.log(`[UserController] Request to soft delete role '${roleName}' for user ${userId} using query parameter.`);

        if (!roleName) {
            console.warn(`[UserController] roleName is missing in request query for user ${userId}.`);
            return res.status(400).json({ error: 'חובה לציין את התפקיד (roleName) למחיקה רכה כ-Query Parameter.' });
        }

        const success = await user_manager.softDeleteUser(userId, roleName); 

        if (success) {
            res.json({ message: `תפקיד '${roleName}' של המשתמש הושבת בהצלחה.` });
        } else {
            res.status(404).json({ error: `תפקיד '${roleName}' לא נמצא עבור משתמש ${userId} או כבר אינו פעיל.` });
        }
    } catch (err) {
        console.error('🚨 Error in softDeleteUser (controller):', err);
        let statusCode = 500;
        let errorMessage = 'נכשל להשבית את התפקיד של המשתמש.';

        if (err.message.includes('משתמש לא נמצא') || err.message.includes('תפקיד לא קיים') || err.message.includes('שם התפקיד חסר')) {
            statusCode = 404; 
        } else if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
            statusCode = 400; 
        }
        res.status(statusCode).json({ error: errorMessage, details: err.message });
    }
};

exports.activateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const activated = await user_manager.activateUser(userId);
        if (activated) {
            res.json({ message: 'המשתמש הופעל מחדש בהצלחה' });
        } else {
            // ה-BL כבר יחזיר false אם המשתמש לא נמצא או כבר פעיל
            res.status(404).json({ error: 'משתמש לא נמצא או כבר פעיל' });
        }
    } catch (err) {
        console.error('Error in activateUser:', err);
        res.status(500).json({ error: 'נכשל להפעיל את המשתמש מחדש', details: err.message });
    }
};

exports.getTrainees = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const trainees = await user_manager.getUsersByRole('client', includeInactive);
        res.json(trainees);
    } catch (err) {
        console.error('Error in getTrainees:', err);
        res.status(500).json({ error: 'נכשל לשלוף את רשימת המתאמנים', details: err.message });
    }
};

exports.getCoaches = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const coaches = await user_manager.getUsersByRole('coach', includeInactive);
        res.json(coaches);
    } catch (err) {
        console.error('Error in getCoaches:', err);
        res.status(500).json({ error: 'נכשל לשלוף את רשימת המאמנים', details: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            console.warn('Refresh token missing from cookies.');
            return res.status(401).json({ error: 'אין רענון טוקן.' });
        }

        const result = await user_manager.refreshAccessToken(token);

        if (!result.succeeded) {
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
            if (result.error.includes('משתמש לא נמצא')) {
                return res.status(404).json({ error: result.error }); 
            }
            return res.status(403).json({ error: result.error || 'רענון טוקן לא תקין או כשל.' }); 
        }
        const { accessToken } = result.data;
        return res.json({ accessToken });
    } catch (err) {
        console.error('Error in refreshToken:', err);
        if (err.name === 'TokenExpiredError') {
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
            return res.status(403).json({ error: 'רענון טוקן פג תוקף, אנא התחבר מחדש.' });
        }
        if (err.name === 'JsonWebTokenError') {
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' });
            return res.status(403).json({ error: 'רענון טוקן לא חוקי.' });
        }
        return res.status(500).json({ error: err.message || 'שגיאה פנימית בשרת בעת רענון טוקן.' });
    }
};

exports.initialLoginOrPasswordSetup = async (req, res) => { 
    try {
        const { email, password } = req.body;
        console.log(`[Controller] Received request to initialLoginOrPasswordSetup for email: ${email}`);
        
        if (!email || !password) {
            return res.status(400).json({ message: 'חובה למלא אימייל וסיסמה.' });
        }

        const result = await user_manager.handleInitialLoginOrPasswordSetup({ email, password });

        if (!result.succeeded) {
            if (result.error.includes('אינו קיים')) {
                return res.status(404).json({ message: result.error }); 
            }
            if (result.error.includes('כבר רשום')) { 
                 return res.status(409).json({ message: result.error, redirectToLogin: true }); 
            }
            
            return res.status(500).json({ message: result.error || 'שגיאה פנימית בשרת.' }); 
        }

        res.status(200).json({
            message: result.message,
            accessToken: result.accessToken, 
            refreshToken: result.refreshToken,
            user: result.user 
        });
    } catch (err) {
        console.error('Error in initialLoginOrPasswordSetup Controller:', err); 
        res.status(500).json({ message: err.message || 'שגיאה פנימית בשרת.' });
    }
};

exports.getUsersByRole = async (req, res) => {
  try {
    const role = req.params.role;
    console.log(`Fetching users with role (controller): ${role}`);
    const users = await user_manager.fetchUsersByRoleSimple(role);
    res.status(200).json({ succeeded: true, data: users });
  } catch (error) {
    console.error('Error fetching users by role (controller):', error);
    res.status(500).json({ succeeded: false, error: 'שגיאה באחזור המשתמשים לפי תפקיד', details: error.message });
  }
};

exports.getUsersByEmails = async (req, res) => {
  try {
    const { emails } = req.body;
    console.log(`Fetching users by emails (controller): ${JSON.stringify(emails)}`);
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ succeeded: false, error: 'Missing or invalid emails array' });
    }

    const users = await user_manager.fetchUsersByEmails(emails);
    return res.json({ succeeded: true, data: users });
  } catch (err) {
    console.error('Error in getUsersByEmails:', err);
    return res.status(500).json({ succeeded: false, error: 'Internal server error' });
  }
};

