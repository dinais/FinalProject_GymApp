const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const favorite = sequelize.define('favorite', {
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        },
        primaryKey: true // Make it part of the composite primary key
    },
    lesson_id: { 
        type: DataTypes.INTEGER, 
        references: {
            model: 'lessons',
            key: 'id'
        },
        primaryKey: true // Make it part of the composite primary key
    }
}, {
    tableName: 'favorites',
    timestamps: false,
    // Add unique constraint on the pair (user_id, lesson_id)
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'lesson_id']
        }
    ]
});

module.exports = favorite;
