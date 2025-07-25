const sequelize = require('../../config/db');
const user = require('./user');
const password = require('./password');
const lesson = require('./lesson');
const lesson_registrations = require('./lesson_registrations');
const favorite = require('./favorite');
const cancellation = require('./cancellation');
const waiting_list = require('./waiting_list');
const role = require('./role');
const message = require('./message');
const user_role = require('./user_role');
const reserved_spot = require('./reserved_spot');

// --------- Associations ---------

// User-Password (One-to-One)
// Assuming password.user_id points to user.id
user.hasOne(password, { foreignKey: 'user_id', as: 'password' });
password.belongsTo(user, { foreignKey: 'user_id', as: 'user' });

// Lesson belongs to Instructor (User)
lesson.belongsTo(user, { foreignKey: 'instructor_id', as: 'Instructor' });
user.hasMany(lesson, { foreignKey: 'instructor_id', as: 'LessonsTaught' });

// Lesson Registrations (User to Lesson via Lesson_Registrations)
lesson_registrations.belongsTo(user, { foreignKey: 'user_id', as: 'user' });
user.hasMany(lesson_registrations, { foreignKey: 'user_id', as: 'LessonRegistrations' });

lesson_registrations.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' });
lesson.hasMany(lesson_registrations, { foreignKey: 'lesson_id', as: 'LessonRegistrations' });

// Favorites (User to Lesson via Favorite)
favorite.belongsTo(user, { foreignKey: 'user_id', as: 'user' });
user.hasMany(favorite, { foreignKey: 'user_id', as: 'Favorites' });

favorite.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' });
lesson.hasMany(favorite, { foreignKey: 'lesson_id', as: 'Favorites' });

// Cancellations (User to Lesson via Cancellation)
cancellation.belongsTo(user, { foreignKey: 'instructor_id', as: 'InstructorCanceled' });
user.hasMany(cancellation, { foreignKey: 'instructor_id', as: 'CancellationsMade' });

cancellation.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' });
lesson.hasMany(cancellation, { foreignKey: 'lesson_id', as: 'Cancellations' });

// Waiting List (User to Lesson via Waiting_List)
waiting_list.belongsTo(user, { foreignKey: 'user_id', as: 'user' });
user.hasMany(waiting_list, { foreignKey: 'user_id', as: 'WaitingLists' });

waiting_list.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' });
lesson.hasMany(waiting_list, { foreignKey: 'lesson_id', as: 'WaitingLists' });

// user-Role (Many-to-Many) 
user.belongsToMany(role, { through: user_role, foreignKey: 'user_id', as: 'roles' });
role.belongsToMany(user, { through: user_role, foreignKey: 'role_id', as: 'users' });

// System Messages (User to System_Message)
message.belongsTo(user, { foreignKey: 'sender_id', as: 'Sender' });
message.belongsTo(user, { foreignKey: 'recipient_id', as: 'Recipient' });

user.hasMany(message, { foreignKey: 'sender_id', as: 'MessagesSent' });
user.hasMany(message, { foreignKey: 'recipient_id', as: 'MessagesReceived' });


// Reserved Spot (User to Lesson via Reserved_Spot)
reserved_spot.belongsTo(lesson, { foreignKey: 'lesson_id', as: 'lesson' });
reserved_spot.belongsTo(user, { foreignKey: 'user_id', as: 'user' });
lesson.hasMany(reserved_spot, { foreignKey: 'lesson_id', as: 'ReservedSpots' });
user.hasMany(reserved_spot, { foreignKey: 'user_id', as: 'ReservedSpots' });

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
    message,
    user_role,
    reserved_spot
};

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;