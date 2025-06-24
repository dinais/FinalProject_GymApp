// API/controllers/messages_controller.js
const messagesManager = require('../../BL/messages_manager');

async function getMessagesByUserId(req, res, next) {
  try {
    const userIdFromToken = req.user.id;
    const userIdFromParams = parseInt(req.params.userId, 10);
    const role = req.query.role; // ✅ קחי את הרול מה-query

    if (isNaN(userIdFromParams)) {
      return res.status(400).json({ message: 'User ID לא חוקי' });
    }

    if (userIdFromToken !== userIdFromParams) {
      return res.status(403).json({ message: 'אין לך הרשאה לצפות בהודעות של משתמש אחר' });
    }

    const messages = await messagesManager.getMessagesByUserId(userIdFromParams, role); // ✅ שלחי גם את הרול
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res) {
  try {
    const result = await messagesManager.sendMessage(req.body);

    if (result.succeeded) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ succeeded: false, error: 'שגיאה בשרת' });
  }
}
async function markMessageAsRead(req, res){
  const messageId = parseInt(req.params.id, 10);

  try {
    const result = await messagesManager.markMessageAsRead(messageId);
    if (!result) {
      return res.status(404).json({ succeeded: false, error: 'Message not found' });
    }
    res.json({ succeeded: true, data: result });
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ succeeded: false, error: 'Internal server error' });
  }
}
module.exports = {
  getMessagesByUserId,
  sendMessage,
  markMessageAsRead
};
