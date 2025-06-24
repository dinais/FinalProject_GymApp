const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const message = sequelize.define('message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  recipient_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },

  sender_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },

  recipient_role: {
    type: DataTypes.STRING
  },

  sender_role: {
    type: DataTypes.STRING
  },
 title: {
    type: DataTypes.STRING
  },
  message: {
    type: DataTypes.STRING
  },
   created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'messages',
  timestamps: false
});

module.exports = message;
