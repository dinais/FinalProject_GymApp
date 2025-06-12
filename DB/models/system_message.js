const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./user');

const system_message = sequelize.define('system_message', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
   user_id: {
    type: DataTypes.INTEGER,
    references: {
        model: 'users',
        key: 'id'
    }
},
    role: DataTypes.STRING,
    message: DataTypes.STRING
}, {
    tableName: 'system_messages',
    timestamps: false
});

// SystemMessage.belongsTo(User, { foreignKey: 'client_id' });

module.exports = system_message;