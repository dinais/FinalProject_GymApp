const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const User = sequelize.define('user', {
    id: { type: DataTypes.STRING, primaryKey: true },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    address: DataTypes.STRING,
    phone: DataTypes.STRING,
    gmail: DataTypes.STRING
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = User;