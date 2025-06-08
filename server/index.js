const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoutes = require('./API/routes/users_router');
require('dotenv').config(); // לקרוא משתנים מ-.env

const app = express();
const PORT = process.env.PORT || 5000;

// התחברות למסד נתונים
const sequelize = require('../DB/config');
const db = require('../DB/models'); // טוען את המודלים והקשרים

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// נתיבים

app.use('/api/users', userRoutes);

// בדיקה
app.get('/', (req, res) => {
  res.send('Welcome to my server!');
});

// התחלת שרת
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');

    if (process.env.NODE_ENV !== 'production') {
      return sequelize.sync(); // רק בפיתוח
    }

    return Promise.resolve(); // אם ב-production
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to the database:', err);
  });