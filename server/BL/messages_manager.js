// API/BL/messages_manager.js
const messagesDAL = require('../DAL/messages_dal');
const { sendEmail } = require('../services/mailer'); // נתיב נכון לקובץ שלך
const usersDAL = require('../DAL/user_dal'); // הנחתי שיש לך DAL כזה לשליפת מייל
async function getMessagesByUserId(userId, role) {
  return await messagesDAL.getMessagesByUserId(userId, role);
}


const emailRelevantTitles = [
  'Unable to Instruct a Specific Class',
  'Available to Replace a Class',
  'Class Cancellation Notification',
  'Class Schedule Change Notification',
  'Request to Replace Instructor'
];

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

    // שליחת מייל אם הכותרת מתאימה
    if (emailRelevantTitles.includes(title)) {
      const recipient = await usersDAL.getUserEmailsById(recipient_id); // נניח שמחזיר { email: '...' }
      console.log(recipient[0].email);

      if (recipient[0].email) {
        await sendEmail(
          recipient[0].email,
          title,
          message
        );
      } else {
        console.warn('Email not sent: recipient not found or missing email');
      }
    }

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
