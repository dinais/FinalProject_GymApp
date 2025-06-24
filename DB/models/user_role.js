const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const UserRole = sequelize.define('UserRole', { 
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
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, 
        allowNull: false
    }
}, {
    tableName: 'user_roles',
    timestamps: false
});

module.exports = UserRole;