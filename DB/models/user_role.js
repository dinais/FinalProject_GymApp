const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const user_role = sequelize.define('user_role', {
    user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
        model: 'users',
        key: 'id'
    }
},
role_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
        model: 'roles',
        key: 'id'
    }
}

}, {
    tableName: 'user_roles',
    timestamps: false
});

module.exports = user_role;
