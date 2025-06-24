const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const favorite = sequelize.define('favorite', {
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        },
        primaryKey: true
    },
    lesson_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'lessons',
            key: 'id'
        },
        primaryKey: true
    }
}, {
    tableName: 'favorites',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'lesson_id']
        }
    ]
});

module.exports = favorite;
