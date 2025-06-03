const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Supplier = sequelize.define('suppliers', {
    company_name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    representative_name: { type: DataTypes.STRING(100), allowNull: false },
    goods: { type: DataTypes.JSON, allowNull: false }
}, {
    tableName: 'suppliers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Supplier;
