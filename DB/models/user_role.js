const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const UserRole = sequelize.define('UserRole', { // שיניתי את השם ל-UserRole (באות גדולה) כדי שיהיה עקבי עם מודלים אחרים
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
    // *** הוספת השדה is_active לטבלת ה-Join ***
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // ברירת מחדל: התפקיד פעיל עבור המשתמש
        allowNull: false
    }
}, {
    tableName: 'user_roles',
    timestamps: false
});

module.exports = UserRole; // שינוי השם גם בייצוא