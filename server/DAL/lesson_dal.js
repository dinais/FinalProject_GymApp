// DAL/lesson_dal.js
const { Op } = require('sequelize');
const { lesson, lesson_registrations, waiting_list, reserved_spot, user } = require('../../DB/models'); // Import relevant models
const { sequelize } = require('../../DB/models'); 

const findLessonById = async (lessonId) => {
    return await lesson.findByPk(lessonId, {
        include: [{
            model: user, // The User model
            as: 'Instructor', // This alias MUST match the association defined in your lesson model
            attributes: ['id', 'first_name', 'last_name', 'email'] // Fields to include from the instructor
        }]
    });
};

const findLessonsByDateRange = async (startDate, endDate) => {
    console.log(`DAL: Querying lessons between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    return await lesson.findAll({
        where: {
            scheduled_at: {
                [Op.between]: [startDate, endDate]
            }
        },
        include: [{
            model: user, // The 'user' model imported above
            as: 'Instructor', // This alias MUST match the association defined in your lesson model
            attributes: ['id', 'first_name', 'last_name', 'email'] // Fields to include from the instructor
        }],
        order: [['scheduled_at', 'ASC']] // Order by time for consistent display
    });
};

const findUserRegisteredLessons = async (userId, startDate, endDate) => {
    return await lesson.findAll({
        include: [{
            model: lesson_registrations,
            as: 'LessonRegistrations', // Ensure this alias matches the association in your model
            where: { user_id: userId },
            attributes: []
        }, { 
            model: user,
            as: 'Instructor', // Use 'Instructor' alias
            attributes: ['id', 'first_name', 'last_name', 'email']
        }],
        where: {
            scheduled_at: { [Op.between]: [startDate, endDate] }
        },
        attributes: {
            include: [[sequelize.literal(`'joined'`), 'status']]
        }
    });
};

const findUserWaitlistedLessons = async (userId, startDate, endDate) => {
    return await lesson.findAll({
        include: [{
            model: waiting_list,
            as: 'WaitingLists', // Ensure this alias matches the association in your model
            where: { user_id: userId },
            attributes: []
        }, { 
            model: user,
            as: 'Instructor', // Use 'Instructor' alias
            attributes: ['id', 'first_name', 'last_name', 'email']
        }],
        where: {
            scheduled_at: { [Op.between]: [startDate, endDate] }
        },
        attributes: {
            include: [[sequelize.literal(`'waitlist'`), 'status']]
        }
    });
};

const countLessonRegistrations = async (lessonId) => {
    return await lesson_registrations.count({
        where: { lesson_id: lessonId }
    });
};

const findLessonRegistration = async (userId, lessonId) => {
    return await lesson_registrations.findOne({
        where: { user_id: userId, lesson_id: lessonId }
    });
};

const createLessonRegistration = async (userId, lessonId) => {
    return await lesson_registrations.create({
        user_id: userId,
        lesson_id: lessonId,
        registration_date: new Date()
    });
};

const findWaitingListItem = async (userId, lessonId) => {
    return await waiting_list.findOne({
        where: { user_id: userId, lesson_id: lessonId }
    });
};

const createWaitingListItem = async (userId, lessonId) => {
    return await waiting_list.create({
        user_id: userId,
        lesson_id: lessonId,
        date: new Date()
    });
};

const deleteLessonRegistration = async (userId, lessonId) => {
    const deletedCount = await lesson_registrations.destroy({
        where: { user_id: userId, lesson_id: lessonId }
    });
    return deletedCount > 0;
};

const deleteWaitingListItem = async (userId, lessonId) => {
    const deletedCount = await waiting_list.destroy({
        where: { user_id: userId, lesson_id: lessonId }
    });
    return deletedCount > 0;
};

const findFirstInWaitlist = async (lessonId) => {
    return await waiting_list.findAll({
        where: { lesson_id: lessonId },
        order: [['date', 'ASC']],
        limit: 1
    });
};

const deleteReservedSpot = async (whereClause) => {
    const deletedCount = await reserved_spot.destroy({ where: whereClause });
    return deletedCount > 0;
};

const createReservedSpot = async (userId, lessonId, expiresAt) => {
    return await reserved_spot.create({
        user_id: userId,
        lesson_id: lessonId,
        expires_at: expiresAt
    });
};

const findActiveReservedSpots = async (lessonId) => {
    return await reserved_spot.findAll({
        where: {
            lesson_id: lessonId,
            expires_at: { [Op.gt]: new Date() } // Greater than current date and time
        }
    });
};

const findUserById = async (userId) => {
    return await user.findByPk(userId);
};

const updateLessonCurrentParticipants = async (lessonId, change) => {
    const [updatedRows] = await lesson.increment('current_participants', {
        by: change,
        where: { id: lessonId }
    });
    // For increment/decrement, updatedRows often contains the updated instance if found
    return updatedRows && updatedRows.length > 0;
};

// New: DAL functions for secretary CRUD operations on lessons

const createLesson = async (lessonData) => {
    console.log('DAL: Creating new lesson with data:', lessonData);
    return await lesson.create(lessonData);
};

// CRITICAL FIX: This function now returns the full updated lesson object.
const updateLessonData = async (lessonId, updatedData) => {
    console.log(`DAL: Updating lesson ${lessonId} with data:`, updatedData);
    const [updatedRowsCount] = await lesson.update(updatedData, {
        where: { id: lessonId }
    });

    if (updatedRowsCount > 0) {
        // If the update was successful, fetch the updated lesson including its instructor data
        // and return the full updated lesson object.
        const updatedLesson = await findLessonById(lessonId); // findLessonById already includes the Instructor
        console.log('DAL: Lesson updated and fetched:', updatedLesson.toJSON());
        return updatedLesson; // Return the Sequelize instance, BL will call toJSON()
    }
    console.warn(`DAL: No rows updated for lesson ID ${lessonId}. Lesson might not exist or no changes were made.`);
    return null; // Return null if no rows were updated (lesson not found or no changes)
};

const deleteLessonById = async (lessonId) => {
    console.log(`DAL: Deleting lesson with ID: ${lessonId}`);
    const deletedRowsCount = await lesson.destroy({
        where: { id: lessonId }
    });
    return deletedRowsCount > 0;
};

// Export all functions at the end of the file
module.exports = {
    findLessonById,
    findLessonsByDateRange,
    findUserRegisteredLessons,
    findUserWaitlistedLessons,
    countLessonRegistrations,
    findLessonRegistration,
    createLessonRegistration,
    findWaitingListItem,
    createWaitingListItem,
    deleteLessonRegistration,
    deleteWaitingListItem,
    findFirstInWaitlist,
    deleteReservedSpot,
    createReservedSpot,
    findActiveReservedSpots,
    findUserById,
    updateLessonCurrentParticipants,
    createLesson,
    updateLessonData,
    deleteLessonById
};
