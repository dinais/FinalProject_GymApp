const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const user = require('./user');
const lesson = require('./lesson');

const lesson_registrations = sequelize.define('my_lesson', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
    type: DataTypes.INTEGER,
    references: {
        model: 'users',
        key: 'id'
    }
},
    lesson_id: { type: DataTypes.INTEGER },
    registration_date: DataTypes.DATE
}, {
    tableName: 'my_lessons',
    timestamps: false
});

module.exports = lesson_registrations;