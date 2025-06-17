// API/routes/role_router.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/users_controller'); // עדיין משתמש ב-userController
const { protect, authorizeRoles } = require('../middleware/auth_middleware'); 

// שליפת כל התפקידים האפשריים במערכת
router.get('/', protect, authorizeRoles('secretary', 'admin'), userController.getAllRoles);

module.exports = router;