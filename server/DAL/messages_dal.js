const db = require('../../DB/models'); // טוען את המודלים של Sequelize
async function createMessage(data) {
  return await db.message.create(data);
}
// const { message, user } = require('../models'); // ודא שאתה מייבא גם את מודל message וגם את מודל user

async function getMessagesByUserId(userId, role) {
  return await db.message.findAll({
    where: {
      recipient_id: userId,
      recipient_role: role
    },
    order: [['id', 'DESC']],
    attributes: ['id', 'sender_id', 'sender_role', 'message', 'title', 'created_at'],
    include: [{
      model: db.user,
      as: 'Sender',
      attributes: ['email'],
      required: false,
      where: {
        is_active: true
      }
    }]
  });
}


module.exports = {
  createMessage,
  getMessagesByUserId,
};

