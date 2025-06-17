// const express = require('express');
// const cors = require('cors');
// const cookieParser = require('cookie-parser');
// const userRouter = require('./API/routes/users_router');
// const lessonRouter = require('./API/routes/lesson_router');
// require('dotenv').config(); 
// //לסדר שההרצה של הבסיס נתונים שתהיה דרך הבסיס נתונים ולא דגרך השרת

// const app = express();
// const PORT = process.env.PORT||5000;
// console.log({path: __dirname + '\\.env'});

// console.log('DB_USER:', process.env.DB_USER);
// console.log('DB_PASS:', process.env.DB_PASS);

// // התחברות למסד נתונים
// const sequelize = require('../DB/config');
// const db = require('../DB/models'); // טוען את המודלים והקשרים

// // Middleware
// app.use((req, res, next) => {
//   console.log(`📥 INCOMING REQUEST: ${req.method} ${req.url}`);
//   next();
// });

// app.use(express.json());
// app.use(cookieParser());
// app.use(cors({
//   origin: ['http://localhost:3000', 'http://localhost:3001','http://localhost:3002','http://localhost:3003','http://localhost:3004'], // הוסף את שני הפורטים
//   credentials: true
// }));

// // נתיבים

// app.use('/api/users', userRouter);
// app.use('/api/lessons', lessonRouter);


// // בדיקה
// app.get('/', (req, res) => {
//   res.send('Welcome to my server!');
// });

// // התחלת שרת
// sequelize.authenticate()
//   .then(() => {
//     console.log('✅ Database connected');

//     if (process.env.NODE_ENV !== 'production') {
//       return sequelize.sync(); // רק בפיתוח
//     }

//     return Promise.resolve(); // אם ב-production
//   })
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`🚀 Server is running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error('❌ Failed to connect to the database:', err);
//   });



const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRouter = require('./API/routes/users_router');
const lessonRouter = require('./API/routes/lesson_router');
const roleRouter = require('./API/routes/role_router');
require('dotenv').config();

// **ייבוא המידלוויר protect מהקובץ המעודכן שלך**
const { protect } = require('./API/middleware/auth_middleware');


const app = express();
const PORT = process.env.PORT || 5000;
console.log({ path: __dirname + '\\.env' });

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Exists' : 'Missing'); // חשוב לוודא שקיים


// התחברות למסד נתונים
const sequelize = require('../DB/config');
const db = require('../DB/models'); // טוען את המודלים והקשרים

// Middleware
app.use((req, res, next) => {
  console.log(`📥 INCOMING REQUEST: ${req.method} ${req.originalUrl}`); // שימוש ב-originalUrl לקבלת הנתיב המלא
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'], // הוסף את שני הפורטים
  credentials: true
}));

// --- נקודה קריטית: הפעלת המידלוויר 'protect' ---
// יש שתי דרכים נפוצות להפעיל את protect:

// 1. הפעלה גלובלית: protect ירוץ על כל בקשה שמגיעה לשרת.
// זה אומר שהלוגיקה של openPaths בתוך protect *חייבת* לכלול את הנתיבים המלאים (לדוגמה: '/api/users/login').
app.use(protect);

// 2. הפעלה ספציפית לראוטר: protect ירוץ רק על בקשות שמיועדות לראוטר מסוים.
// אם תבחר בזה, אז ה-openPaths בתוך protect יכולים להיות יחסיים (לדוגמה: '/login' אם הוא מופעל רק על /api/users).
// לדוגמה: app.use('/api/users', protect, userRouter); // ואז protect יחול רק על נתיבי /api/users
// אבל כפי שהמידלוויר 'protect' שלך כתוב כרגע (עם openPaths מלאים כמו '/api/users/login'),
// הדרך הגלובלית (app.use(protect)) היא הדרך הנכונה.

// נתיבים
app.use('/api/users', userRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/roles', roleRouter);


// בדיקה
app.get('/', (req, res) => {
  res.send('Welcome to my server!');
});

// טיפול בשגיאות 404 - אם אף ראוט לא תפס את הבקשה
app.use((req, res, next) => {
  res.status(404).json({ message: 'הנתיב המבוקש לא נמצא (404 Not Found)' });
});

// טיפול בשגיאות כלליות (מידלוויר טיפול בשגיאות עם 4 ארגומנטים)
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'שגיאה פנימית בשרת.',
    error: process.env.NODE_ENV === 'development' ? err : {} // להציג פרטי שגיאה מלאים רק בפיתוח
  });
});


// התחלת שרת
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');

    if (process.env.NODE_ENV !== 'production') {
      return sequelize.sync(); // רק בפיתוח - יסנכרן את המודלים לבסיס הנתונים
    }

    return Promise.resolve(); // אם ב-production, אל תעשה sync
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`💡 JWT_SECRET status: ${process.env.JWT_SECRET ? 'Defined' : 'UNDEFINED - CHECK YOUR .ENV FILE!'}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to the database:', err);
    process.exit(1); // יציאה מהתהליך אם אין חיבור לבסיס נתונים
  });