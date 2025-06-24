const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const userRouter = require('./API/routes/users_router');
const lessonRouter = require('./API/routes/lesson_router');
const roleRouter = require('./API/routes/role_router');
const messagesRouter = require('./API/routes/messages_router');
const { protect } = require('./API/middleware/auth_middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// בדיקות סביבה
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Exists' : 'Missing');

// Middleware
app.use((req, res, next) => {
  console.log(`📥 INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004'
  ],
  credentials: true
}));

app.use(protect);

// Routes
app.use('/api/users', userRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/roles', roleRouter);
app.use('/api/messages', messagesRouter);

app.get('/', (req, res) => {
  res.send('Welcome to my server!');
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'הנתיב המבוקש לא נמצא (404 Not Found)' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'שגיאה פנימית בשרת.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server 
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`💡 JWT_SECRET status: ${process.env.JWT_SECRET ? 'Defined' : 'UNDEFINED - CHECK YOUR .ENV FILE!'}`);
});

