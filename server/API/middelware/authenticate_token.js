const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const secret = process.env.TOKEN_SECRET;

function authenticateToken(req, res, next) {
  const openPaths = ['/login', '/register', '/refresh-token']; 

  if (openPaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'אין טוקן' });

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ message: 'טוקן לא תקין או פג תוקף' });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
