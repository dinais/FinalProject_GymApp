const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const role = sequelize.define('role', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    role: {
        type: DataTypes.ENUM('coach', 'client', 'secretary'), // הוסף את כל התפקידים שאתה משתמש בהם!
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'roles',
    timestamps: false
});

module.exports = role;