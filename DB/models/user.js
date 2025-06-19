const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const user = sequelize.define('user', {
    id: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    // *** שדות כתובת חדשים במקום 'address' אחד ***
    street_name: {
        type: DataTypes.STRING,
        allowNull: true // אפשר לאפשר NULL אם הכתובת לא חובה בהרשמה ראשונית
    },
    house_number: {
        type: DataTypes.STRING, // נשאיר כ-STRING כדי לתמוך בתוספות כמו 'א', 'ב' (לדוגמה: 12א)
        allowNull: true
    },
    apartment_number: { // אופציונלי - למספר דירה, כניסה, קומה
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    zip_code: {
        type: DataTypes.STRING, // מיקוד יכול להכיל מקפים (לדוגמה: 12345-6789)
        allowNull: true
    },
    country: { // מומלץ אם יש פוטנציאל ללקוחות מחו"ל, אחרת אפשר להגדיר כברירת מחדל 'ישראל'
        type: DataTypes.STRING,
        defaultValue: 'ישראל',
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // כברירת מחדל, משתמש חדש פעיל
    },
    // *** סוף שדות כתובת חדשים ***
    phone: DataTypes.STRING,
    email: DataTypes.STRING
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = user;