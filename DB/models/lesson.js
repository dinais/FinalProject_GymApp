const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const lesson = sequelize.define('lessons', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    lesson_type: DataTypes.STRING,
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
    current_participants: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    scheduled_at: DataTypes.DATE 
}, {
    tableName: 'lessons',
    timestamps: false
});

module.exports = lesson;
