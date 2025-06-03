const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./user');

const SystemMessage = sequelize.define('system_message', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    client_id: { type: DataTypes.STRING },
    role: DataTypes.STRING,
    message: DataTypes.STRING
}, {
    tableName: 'system_messages',
    timestamps: false
});

// SystemMessage.belongsTo(User, { foreignKey: 'client_id' });

module.exports = SystemMessage;