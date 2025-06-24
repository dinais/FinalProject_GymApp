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
    street_name: {
        type: DataTypes.STRING,
        allowNull: true 
    },
    house_number: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    apartment_number: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    zip_code: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    country: { 
        type: DataTypes.STRING,
        defaultValue: 'ישראל',
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true 
    },
    phone: DataTypes.STRING,
    email: DataTypes.STRING
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = user;