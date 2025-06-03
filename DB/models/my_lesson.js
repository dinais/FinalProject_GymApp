const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./user');
const Lesson = require('./lesson');

const MyLesson = sequelize.define('my_lesson', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.STRING },
    lesson_id: { type: DataTypes.INTEGER },
    registration_date: DataTypes.DATE
}, {
    tableName: 'my_lessons',
    timestamps: false
});

// MyLesson.belongsTo(User, { foreignKey: 'user_id' });
// MyLesson.belongsTo(Lesson, { foreignKey: 'lesson_id' });

module.exports = MyLesson;