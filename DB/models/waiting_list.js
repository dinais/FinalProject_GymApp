const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./user');
const Lesson = require('./lesson');

const WaitingList = sequelize.define('waiting_list', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    client_id: { type: DataTypes.STRING },
    lesson_id: { type: DataTypes.INTEGER },
    date: DataTypes.DATE
}, {
    tableName: 'waiting_list',
    timestamps: false
});

// WaitingList.belongsTo(User, { foreignKey: 'client_id' });
// WaitingList.belongsTo(Lesson, { foreignKey: 'lesson_id' });

module.exports = WaitingList;