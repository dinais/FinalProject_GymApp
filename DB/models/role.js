const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const User = require('./user');

const Role = sequelize.define('role', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    client_id: { type: DataTypes.STRING },
    role: DataTypes.STRING // אפשר גם ENUM אם רוצים
}, {
    tableName: 'roles',
    timestamps: false
});

Role.belongsTo(User, { foreignKey: 'client_id' });

module.exports = Role;