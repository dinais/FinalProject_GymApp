const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const User = require('./user');
const Lesson = require('./lesson');

const Cancellation = sequelize.define('cancellation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    instructor_id: { type: DataTypes.STRING },
    lesson_id: { type: DataTypes.INTEGER },
    notes: DataTypes.STRING
}, {
    tableName: 'cancellations',
    timestamps: false
});

Cancellation.belongsTo(User, { foreignKey: 'instructor_id' });
Cancellation.belongsTo(Lesson, { foreignKey: 'lesson_id' });

module.exports = Cancellation;