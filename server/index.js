const express = require('express');
const app = express();
require('dotenv').config(); // כדי לקרוא מ .env
const PORT = process.env.PORT || 5000;

// ייבוא החיבור למסד הנתונים
const sequelize = require('../DB/config');

// טוען את כל המודלים ומבצע את הקשרים ביניהם
const db = require('../DB/models');

// כדי לפרש בקשות JSON
app.use(express.json());

// בדיקה שהשרת עובד
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

// התחברות למסד והפעלת השרת
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
    return sequelize.sync(); // לא חובה אם הטבלאות כבר קיימות
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to the database:', err);
  });