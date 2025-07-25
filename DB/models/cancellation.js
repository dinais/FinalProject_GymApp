const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const cancellation = sequelize.define('cancellation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    instructor_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    lesson_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'lessons',
            key: 'id'
        }
    },
    notes: DataTypes.STRING
}, {
    tableName: 'cancellations',
    timestamps: false
});

module.exports = cancellation;
