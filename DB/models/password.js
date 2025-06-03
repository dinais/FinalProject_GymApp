const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const User = require('./user');

const Password = sequelize.define('password', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.STRING },
    hash: DataTypes.STRING
}, {
    tableName: 'passwords',
    timestamps: false
});

Password.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Password;