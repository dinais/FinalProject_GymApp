const db = require('../../DB/models'); // טוען את המודלים של Sequelize
async function createMessage(data) {
  return await db.message.create(data);
}
async function getMessagesByUserId(userId, role) {
  return await db.message.findAll({
    where: {
      recipient_id: userId,
      recipient_role: role
    },
    order: [['id', 'DESC']],
    attributes: ['id', 'sender_id', 'sender_role', 'message', 'title', 'created_at'],
  });
}

module.exports = {
  createMessage,
  getMessagesByUserId,
};

