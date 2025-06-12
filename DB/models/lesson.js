const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const user = require('./user');

const lesson = sequelize.define('lesson', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    lesson_type: DataTypes.STRING,
    hours: DataTypes.INTEGER,
    day: DataTypes.STRING,
    instructor_id: DataTypes.STRING,
    room_number: DataTypes.STRING,
    max_participants: DataTypes.INTEGER,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE
}, {
    tableName: 'lessons',
    timestamps: false
});

// Lesson.belongsTo(User, { foreignKey: 'instructor_id', as: 'Instructor' });

module.exports = lesson;