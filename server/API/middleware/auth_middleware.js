// API/middleware/auth_middleware.js
const jwt = require('jsonwebtoken');
const { user, role } = require('../../../DB/models'); // ודא נתיב נכון ל-DB/models
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // ודא נתיב נכון ל-.env

const protect = async (req, res, next) => {
    console.log('Protect Middleware:', req.method, req.path);
    const openPaths = [
        '/api/users/login',
        '/api/users/register',
        '/api/users/refresh-token',
        '/api/users/initial-login-or-password-setup'
    ];
    
    const isPathOpen = openPaths.some(path => req.path.startsWith(path));
    console.log('Is path open:', isPathOpen);
    if (isPathOpen) {
        return next();
    }
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'לא מורשה: אין טוקן גישה.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.TOKEN_SECRET);
console.log('Decoded JWT payload:', decoded);

        const fullUser = await user.findByPk(decoded.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{
                model: role,
                as: 'roles',
                through: { attributes: [] },
                attributes: ['role']
            }]
        });

        if (!fullUser) {
            return res.status(401).json({ message: 'לא מורשה: משתמש לא נמצא בבסיס הנתונים.' });
        }

        req.user = {
            ...fullUser.toJSON(),
            roles: fullUser.roles.map(r => r.role)
        };

        next();

    } catch (error) {
        console.error('JWT Verification Error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'ההתחברות פגה: הטוקן פג תוקף, אנא רענן טוקן.' });
        }
        res.status(403).json({ message: 'לא מורשה: טוקן גישה לא תקין או כשל באימות.' });
    }
};
 
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles || !Array.isArray(req.user.roles) || !roles.some(role => req.user.roles.includes(role))) {
            return res.status(403).json({ message: 'אסור: אין לך הרשאה לבצע פעולה זו.' });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };