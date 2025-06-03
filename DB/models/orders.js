const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Orders = sequelize.define('orders', {
    store_owner_id: { type: DataTypes.INTEGER },
    supplier_id: { type: DataTypes.INTEGER },
    status: {
        type: DataTypes.ENUM('ממתינה', 'בתהליך', 'הושלמה'),
        defaultValue: 'ממתינה'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'orders',
    timestamps: false
});

module.exports = Orders;
