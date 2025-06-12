const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const cancellation = sequelize.define('cancellation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    instructor_id: { type: DataTypes.STRING },
    lesson_id: { type: DataTypes.INTEGER },
    notes: DataTypes.STRING
}, {
    tableName: 'cancellations',
    timestamps: false
});


module.exports = cancellation;