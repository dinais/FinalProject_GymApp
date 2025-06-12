const { DataTypes } = require('sequelize');
const sequelize = require('../config');
const user = require('./user');

const password = sequelize.define('password', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
    type: DataTypes.INTEGER,
    references: {
        model: 'users',
        key: 'id'
    }
},
    hash: DataTypes.STRING
}, {
    tableName: 'passwords',
    timestamps: false
});

// Password.belongsTo(User, { foreignKey: 'user_id' });

module.exports = password;