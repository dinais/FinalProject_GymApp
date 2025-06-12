const { DataTypes } = require('sequelize');
const sequelize = require('../config');


const waiting_list = sequelize.define('waiting_list', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
    type: DataTypes.INTEGER,
    references: {
        model: 'users',
        key: 'id'
    }
},
    lesson_id: { type: DataTypes.INTEGER },
    date: DataTypes.DATE
}, {
    tableName: 'waiting_list',
    timestamps: false
});

module.exports = waiting_list;