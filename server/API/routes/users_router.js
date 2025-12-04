// API/routes/users_router.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/users_controller');
const { protect, authorizeRoles } = require('../middleware/auth_middleware'); 

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/refresh-token', userController.refreshToken); 
router.get('/by-role/:role', userController.getUsersByRole);
router.post('/by-emails', userController.getUsersByEmails);

router.post('/initial-login-or-password-setup', userController.initialLoginOrPasswordSetup); 

router.use(protect); 

router.get('/', authorizeRoles('secretary', 'admin'), userController.getAllUsers);

router.get('/:id', userController.getUserById);

router.put('/:id', authorizeRoles('secretary', 'admin'), userController.updateUser);

router.delete('/:id', authorizeRoles('secretary', 'admin'), userController.softDeleteUser);

router.put('/:id/activate', authorizeRoles('secretary', 'admin'), userController.activateUser);

router.get('/secretary/role/client', authorizeRoles('secretary', 'admin'), userController.getTrainees); 

router.get('/secretary/role/coach', authorizeRoles('secretary', 'admin'), userController.getCoaches);




module.exports = router;