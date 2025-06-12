const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const favorite = sequelize.define('favorite', {
    user_id: {
    type: DataTypes.INTEGER,
    references: {
        model: 'users',
        key: 'id'
    }
},
    lesson_id: { type: DataTypes.INTEGER, primaryKey: true }
}, {
    tableName: 'favorites',
    timestamps: false
});

module.exports = favorite;