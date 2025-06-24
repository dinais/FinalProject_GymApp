const sequelize = require('../config');
// ייבוא מודלים
const user = require('./user');
const password = require('./password');
const lesson = require('./lesson');
const lesson_registrations = require('./lesson_registrations');
const favorite = require('./favorite');
const cancellation = require('./cancellation');
const waiting_list = require('./waiting_list');
const role = require('./role');
const system_message = require('./system_message');
const user_role = require('./user_role'); // מודל טבלת ה-Join
const reserved_spot = require('./reserved_spot');

// --------- Associations ---------

// User-Password (One-to-One)
// Assuming password.user_id points to user.id
user.hasOne(password, { foreignKey: 'user_id', as: 'password' }); // למשתמש יש סיסמה אחת (password.user_id הוא FK)
password.belongsTo(user, { foreignKey: 'user_id', as: 'user' }); // סיסמה שייכת למשתמש אחד

// Lesson belongs to Instructor (User)
lesson.belongsTo(user, { foreignKey: 'instructor_id', as: 'Instructor' });
user.hasMany(lesson, { foreignKey: 'instructor_id', as: 'LessonsTaught' });

// Lesson Registrations (User to Lesson via Lesson_Registrations)
lesson_registrations.belongsTo(user, { foreignKey: 'user_id', as: 'user' }); // הוסף as: 'user' לבהירות
user.hasMany(lesson_registrations, { foreignKey: 'user_id', as: 'LessonRegistrations' }); // הוסף as

lesson_registrations.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' }); // הוסף as
lesson.hasMany(lesson_registrations, { foreignKey: 'lesson_id', as: 'LessonRegistrations' }); // הוסף as

// Favorites (User to Lesson via Favorite)
favorite.belongsTo(user, { foreignKey: 'user_id', as: 'user' }); // הוסף as
user.hasMany(favorite, { foreignKey: 'user_id', as: 'Favorites' }); // הוסף as

favorite.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' }); // הוסף as
lesson.hasMany(favorite, { foreignKey: 'lesson_id', as: 'Favorites' }); // הוסף as

// Cancellations (User to Lesson via Cancellation)
cancellation.belongsTo(user, { foreignKey: 'instructor_id', as: 'InstructorCanceled' }); // השאר כפי שהיה
user.hasMany(cancellation, { foreignKey: 'instructor_id', as: 'CancellationsMade' }); // השאר כפי שהיה

cancellation.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' }); // הוסף as
lesson.hasMany(cancellation, { foreignKey: 'lesson_id', as: 'Cancellations' }); // הוסף as

// Waiting List (User to Lesson via Waiting_List)
waiting_list.belongsTo(user, { foreignKey: 'user_id', as: 'user' }); // הוסף as
user.hasMany(waiting_list, { foreignKey: 'user_id', as: 'WaitingLists' }); // הוסף as

waiting_list.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' }); // הוסף as
lesson.hasMany(waiting_list, { foreignKey: 'lesson_id', as: 'WaitingLists' }); // הוסף as

// user-Role (Many-to-Many) - זהו הקשר הנכון והיחיד!
user.belongsToMany(role, { through: user_role , foreignKey: 'user_id', as: 'roles' }); // *** חובה להוסיף as: 'roles' ***
role.belongsToMany(user, { through: user_role , foreignKey: 'role_id', as: 'users' }); // *** חובה להוסיף as: 'users' ***

// System Messages (User to System_Message)
system_message.belongsTo(user, { foreignKey: 'user_id', as: 'user' }); // הוסף as
user.hasMany(system_message, { foreignKey: 'user_id', as: 'SystemMessages' }); // הוסף as

// Reserved Spot (User to Lesson via Reserved_Spot)
reserved_spot.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' }); // הוסף as
reserved_spot.belongsTo(user, { foreignKey: 'user_id', as: 'user' }); // הוסף as
lesson.hasMany(reserved_spot, { foreignKey: 'lesson_id', as: 'ReservedSpots' }); // הוסף as
user.hasMany(reserved_spot, { foreignKey: 'user_id', as: 'ReservedSpots' }); // הוסף as


// ייצוא כל המודלים
const db = {
    sequelize,
    user,
    password,
    lesson,
    lesson_registrations,
    favorite,
    cancellation,
    waiting_list,
    role,
    system_message,
    user_role,
    reserved_spot
};

// הוסף את ה-associations לאובייקט db כך שיהיו זמינים דרך db.models
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db; // ודא שאתה מייצא את האובייקט המלא