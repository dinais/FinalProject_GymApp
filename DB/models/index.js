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
Password.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Password, { foreignKey: 'userId' });

// שיעור שייך למדריך (User)
Lesson.belongsTo(User, { foreignKey: 'instructorId', as: 'Instructor' });
User.hasMany(Lesson, { foreignKey: 'instructorId', as: 'LessonsTaught' });

// MyLesson – קישור בין משתמש לשיעור
MyLesson.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(MyLesson, { foreignKey: 'userId' });

MyLesson.belongsTo(Lesson, { foreignKey: 'lessonId' });
Lesson.hasMany(MyLesson, { foreignKey: 'lessonId' });

// Favorites
Favorite.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Favorite, { foreignKey: 'userId' });

Favorite.belongsTo(Lesson, { foreignKey: 'lessonId' });
Lesson.hasMany(Favorite, { foreignKey: 'lessonId' });

// Cancellations
Cancellation.belongsTo(User, { foreignKey: 'instructorId', as: 'InstructorCanceled' });
User.hasMany(Cancellation, { foreignKey: 'instructorId', as: 'CancellationsMade' });

Cancellation.belongsTo(Lesson, { foreignKey: 'lessonId' });
Lesson.hasMany(Cancellation, { foreignKey: 'lessonId' });

// Waiting List
WaitingList.belongsTo(User, { foreignKey: 'clientId' });
User.hasMany(WaitingList, { foreignKey: 'clientId' });

WaitingList.belongsTo(Lesson, { foreignKey: 'lessonId' });
Lesson.hasMany(WaitingList, { foreignKey: 'lessonId' });

// Roles
Role.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Role, { foreignKey: 'userId' });

// System Messages
SystemMessage.belongsTo(User, { foreignKey: 'clientId' });
User.hasMany(SystemMessage, { foreignKey: 'clientId' });

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
