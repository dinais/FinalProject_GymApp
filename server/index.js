const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRouter = require('./API/routes/users_router');
const lessonRouter = require('./API/routes/lesson_router');
require('dotenv').config(); 
//לסדר שההרצה של הבסיס נתונים שתהיה דרך הבסיס נתונים ולא דגרך השרת

const app = express();
const PORT = process.env.PORT||5000;
console.log({path: __dirname + '\\.env'});

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);

// התחברות למסד נתונים
const sequelize = require('../DB/config');
const db = require('../DB/models'); // טוען את המודלים והקשרים

// Middleware
app.use((req, res, next) => {
  console.log(`📥 INCOMING REQUEST: ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001','http://localhost:3002','http://localhost:3003','http://localhost:3004'], // הוסף את שני הפורטים
  credentials: true
}));

// נתיבים

app.use('/api/users', userRouter);
app.use('/api/lessons', lessonRouter);


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