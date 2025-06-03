const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./user');
const Lesson = require('./lesson');

const Favorite = sequelize.define('favorite', {
    user_id: { type: DataTypes.STRING, primaryKey: true },
    lesson_id: { type: DataTypes.INTEGER, primaryKey: true }
}, {
    tableName: 'favorites',
    timestamps: false
});

// Favorite.belongsTo(User, { foreignKey: 'user_id' });
// Favorite.belongsTo(Lesson, { foreignKey: 'lesson_id' });

module.exports = Favorite;