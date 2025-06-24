// API/BL/messages_manager.js
const messagesDAL = require('../DAL/messages_dal');

async function getMessagesByUserId(userId, role) {
  return await messagesDAL.getMessagesByUserId(userId, role);
}
async function sendMessage(data) {
  const { sender_id, sender_role, title, message, recipient_id, recipient_role } = data;

  if (!sender_id || !title || !message || !recipient_id || !recipient_role) {
    return { succeeded: false, error: 'אנא מלא את כל השדות הנדרשים.' };
  }

  try {
    const newMessage = await messagesDAL.createMessage({
      sender_id,
      sender_role: sender_role || 'coach',
      recipient_id,
      recipient_role,
      title,
      message,
      created_at: new Date()
    });

    return { succeeded: true, data: newMessage };
  } catch (err) {
    console.error('Manager Error:', err);
    return { succeeded: false, error: 'שליחת ההודעה נכשלה' };
  }
}
async function markMessageAsRead(messageId) {
  return await messagesDAL.updateMessageReadStatus(messageId, true);
};

    



module.exports = {
  getMessagesByUserId,
  sendMessage,
  markMessageAsRead
};
