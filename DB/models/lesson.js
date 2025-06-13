const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const lesson = sequelize.define('lessons', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    lesson_type: DataTypes.STRING,
    hours: DataTypes.INTEGER,
    day: DataTypes.STRING,
    instructor_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    room_number: DataTypes.STRING,
    max_participants: DataTypes.INTEGER,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE
}, {
    tableName: 'lessons',
    timestamps: false
});

module.exports = lesson;
