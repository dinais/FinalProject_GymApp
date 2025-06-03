const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const StoreOwner = sequelize.define('store_owner', {
    username: { type: DataTypes.STRING(50), allowNull: false },
    password: { type: DataTypes.STRING(255), allowNull: false }
}, {
    tableName: 'store_owner',
    timestamps: false
});

module.exports = StoreOwner;
