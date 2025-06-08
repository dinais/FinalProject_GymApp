const express = require('express');
const router = express.Router();
const userController = require('../controllers/users_controller');

// הרשמה משתמש חדש
router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

// שליפת כל המשתמשים
router.get('/', userController.getAllUsers);

// שליפת משתמש לפי ID
router.get('/:id', userController.getUserById);

// עדכון משתמש
router.put('/:id', userController.updateUser);

// מחיקת משתמש
router.delete('/:id', userController.deleteUser);

// רענון טוקן
router.post('/refresh-token', userController.refreshToken);

module.exports = router;
