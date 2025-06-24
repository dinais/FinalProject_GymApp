// API/routes/messages_router.js
const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages_controller');
const { protect } = require('../middleware/auth_middleware');

router.use(protect);

// במקום לשלוף את ההודעות של המשתמש המחובר מתוך ה-token, מקבלים userId בפרמטר URL
router.get('/:userId', messagesController.getMessagesByUserId);
router.post('/', messagesController.sendMessage);
router.put('/:id/mark-read', messagesController.markMessageAsRead);

module.exports = router;
