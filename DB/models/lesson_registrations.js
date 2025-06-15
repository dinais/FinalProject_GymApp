const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const user = require('./user');
const lesson = require('./lesson');

const lesson_registrations = sequelize.define('lesson_registrations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: user,
      key: 'id'
    }
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    references: {
      model: lesson,
      key: 'id'
    }
  },
  registration_date: DataTypes.DATE
}, {
  tableName: 'lesson_registrations',
  timestamps: false
});

module.exports = lesson_registrations;
