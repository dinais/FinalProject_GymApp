// models/reserved_spot.js (או היכן שמתאים במבנה שלך)
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ReservedSpot = sequelize.define('reserved_spots', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'reserved_spots',
  timestamps: false
});

module.exports = ReservedSpot;
