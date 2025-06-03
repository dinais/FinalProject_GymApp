const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Inventory = sequelize.define('inventory', {
    product_name: { type: DataTypes.STRING(100) },
    quantity: { type: DataTypes.INTEGER },
    min_quantity: { type: DataTypes.INTEGER }
}, {
    tableName: 'inventory',
    timestamps: false
});

module.exports = Inventory;
