const sequelize = require('../config');
// ייבוא מודלים
const User = require('./user');
const Password = require('./password');
const Lesson = require('./lesson');
const MyLesson = require('./my_lesson');
const Favorite = require('./favorite');
const Cancellation = require('./cancellation');
const WaitingList = require('./waiting_list');
const Role = require('./role');
const SystemMessage = require('./system_message');

// --------- Associations ---------

// Password שייך ל-User
Password.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Password, { foreignKey: 'user_id', as: 'password' });

// שיעור שייך למדריך (User)
Lesson.belongsTo(User, { foreignKey: 'instructor_id', as: 'Instructor' });
User.hasMany(Lesson, { foreignKey: 'instructor_id', as: 'LessonsTaught' });

// MyLesson – קישור בין משתמש לשיעור
MyLesson.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(MyLesson, { foreignKey: 'user_id' });

MyLesson.belongsTo(Lesson, { foreignKey: 'lesson_id' });
Lesson.hasMany(MyLesson, { foreignKey: 'lesson_id' });

// Favorites
Favorite.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Favorite, { foreignKey: 'user_id' });

Favorite.belongsTo(Lesson, { foreignKey: 'lesson_id' });
Lesson.hasMany(Favorite, { foreignKey: 'lesson_id' });

// Cancellations
Cancellation.belongsTo(User, { foreignKey: 'instructor_id', as: 'InstructorCanceled' });
User.hasMany(Cancellation, { foreignKey: 'instructor_id', as: 'CancellationsMade' });

Cancellation.belongsTo(Lesson, { foreignKey: 'lesson_id' });
Lesson.hasMany(Cancellation, { foreignKey: 'lesson_id' });

// Waiting List
WaitingList.belongsTo(User, { foreignKey: 'client_id' });
User.hasMany(WaitingList, { foreignKey: 'client_id' });

WaitingList.belongsTo(Lesson, { foreignKey: 'lesson_id' });
Lesson.hasMany(WaitingList, { foreignKey: 'lesson_id' });

// Roles
Role.belongsTo(User, { foreignKey: 'client_id', as: 'user' });
User.hasMany(Role, { foreignKey: 'client_id', as: 'roles' });


// System Messages
SystemMessage.belongsTo(User, { foreignKey: 'client_id' });
User.hasMany(SystemMessage, { foreignKey: 'client_id' });

// ייצוא כל המודלים
module.exports = {
    sequelize,
    User,
    Password,
    Lesson,
    MyLesson,
    Favorite,
    Cancellation,
    WaitingList,
    Role,
    SystemMessage
};
