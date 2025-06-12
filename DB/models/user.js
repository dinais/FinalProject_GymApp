const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const user = sequelize.define('user', {
    id: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    address: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = user;
