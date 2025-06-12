const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const role = sequelize.define('role', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    role: { type: DataTypes.STRING }
}, {
    tableName: 'roles',
    timestamps: false
});

module.exports = role;
