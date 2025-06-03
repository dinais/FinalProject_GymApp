const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const OrderItem = sequelize.define('order_items', {
    order_id: { type: DataTypes.INTEGER },
    product_name: { type: DataTypes.STRING(100) },
    quantity: { type: DataTypes.INTEGER },
    price_per_unit: { type: DataTypes.DECIMAL(10, 2) }
}, {
    tableName: 'order_items',
    timestamps: false
});

module.exports = OrderItem;
