
const UserManager = require('../../BL/UserManager');
const jwt = require('jsonwebtoken');
//לשנות לפונקציות היחידות שיש היוזר מנגר ב BL

exports.registerUser = async (req, res) => {
  try {
    const userData = req.body;

    if (!userData.roleId) {
      return res.status(400).json({ error: 'יש לציין תפקיד (roleId)' });
    }

    const newUser = await UserManager.registerUser(userData);
    res.status(201).json({ message: 'המשתמש נרשם בהצלחה', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'נכשל לרשום את המשתמש' });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { gmail, password } = req.body;
    const result = await UserManager.login({ gmail, password });

    if (!result.succeeded) {
      // במקרה של כשלון, מחזירים שגיאה ללקוח
      return res.status(401).json({ message: result.error });
    }

    const { accessToken, refreshToken, user } = result.data;

    // שמור את ה-refreshToken כ-cookie HttpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // שנה ל־true אם ב־https
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ימים
    });

    res.json({ accessToken, user }); // החזר גם את ה-user ל־React אם צריך
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: err.message || 'Login failed' });
  }
};



exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserManager.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await UserManager.getUserById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updated = await UserManager.updateUser(req.params.id, req.body);
    if (updated) {
      res.json({ message: 'User updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found or no changes' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await UserManager.deleteUser(req.params.id);
    if (deleted) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};


// API/controllers/users_controller.js

exports.refreshToken = async (req, res) => {
  try {
    // אם השתמשת ב-HtppOnly cookie:
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'אין רענון טוקן' });

    // בדיקה ויצירת accessToken חדש
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign(
      { id: payload.id, roles: payload.roles },
      process.env.TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ error: 'refresh token לא תקין' });
  }
};
