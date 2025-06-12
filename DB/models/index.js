const sequelize = require('../config');
// ייבוא מודלים
const user = require('./user');
const password = require('./password');
const lesson = require('./lesson');
const my_lesson = require('./lesson_registrations');
const favorite = require('./favorite');
const cancellation = require('./cancellation');
const waiting_list = require('./waiting_list');
const role = require('./role');
const system_message = require('./system_message');
const user_role = require('./user_role');


// --------- Associations ---------

// Password שייך ל-User
password.belongsTo(user, { foreignKey: 'user_id', as: 'user' });
user.hasOne(password, { foreignKey: 'user_id', as: 'password' });

// שיעור שייך למדריך (User)
lesson.belongsTo(user, { foreignKey: 'instructor_id', as: 'Instructor' });
user.hasMany(lesson, { foreignKey: 'instructor_id', as: 'LessonsTaught' });

// MyLesson – קישור בין משתמש לשיעור
my_lesson.belongsTo(user, { foreignKey: 'user_id' });
user.hasMany(my_lesson, { foreignKey: 'user_id' });

my_lesson.belongsTo(lesson, { foreignKey: 'lesson_id' });
lesson.hasMany(my_lesson, { foreignKey: 'lesson_id' });

// Favorites
favorite.belongsTo(user, { foreignKey: 'user_id' });
user.hasMany(favorite, { foreignKey: 'user_id' });

favorite.belongsTo(lesson, { foreignKey: 'lesson_id' });
lesson.hasMany(favorite, { foreignKey: 'lesson_id' });

// Cancellations
cancellation.belongsTo(user, { foreignKey: 'instructor_id', as: 'InstructorCanceled' });
user.hasMany(cancellation, { foreignKey: 'instructor_id', as: 'CancellationsMade' });

// Cancellation
cancellation.belongsTo(lesson, { foreignKey: 'lesson_id' });
lesson.hasMany(cancellation, { foreignKey: 'lesson_id' });

// Waiting List
waiting_list.belongsTo(user, { foreignKey: 'user_id' });
user.hasMany(waiting_list, { foreignKey: 'user_id' });

waiting_list.belongsTo(lesson, { foreignKey: 'lesson_id' });
lesson.hasMany(waiting_list, { foreignKey: 'lesson_id' });

// Roles
role.belongsTo(user, { foreignKey: 'user_id', as: 'user' });
user.hasMany(role, { foreignKey: 'user_id', as: 'roles' });

// user-Role
user.belongsToMany(role, { through: user_roles , foreignKey: 'user_id' });
role.belongsToMany(user, { through: user_roles , foreignKey: 'role_id' });

// System Messages
system_message.belongsTo(user, { foreignKey: 'user_id' });
user.hasMany(system_message, { foreignKey: 'user_id' });

// ייצוא כל המודלים
module.exports = {
    sequelize,
    user,
    password,
    lesson,
    my_lesson,
    favorite,
    cancellation,
    waiting_list,
    role,
    system_message,
    user_role
};
