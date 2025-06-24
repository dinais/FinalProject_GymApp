// DAL/lesson_dal.js
const { Op } = require('sequelize');
const { lesson, lesson_registrations, waiting_list, reserved_spot, user, favorite } = require('../../DB/models'); 
const { sequelize } = require('../../DB/models'); 

const isLessonFavoriteForUser = async (lessonId, userId) => {
    if (!userId) return false; 
    const fav = await favorite.findOne({ where: { lesson_id: lessonId, user_id: userId } });
    return !!fav; 
};

const findLessonById = async (lessonId) => {
    return await lesson.findByPk(lessonId, {
        include: [{
            model: user, 
            as: 'Instructor', 
            attributes: ['id', 'first_name', 'last_name', 'email'] 
        }]
    });
};

const findLessonsByDateRange = async (startDate, endDate, userId = null) => { 
    console.log(`DAL-findLessonsByDateRange: Querying lessons between ${startDate.toISOString()} and ${endDate.toISOString()} (UTC) for user ${userId || 'N/A'}`);
    const lessons = await lesson.findAll({
        where: {
            scheduled_at: {
                [Op.between]: [startDate, endDate]
            }
        },
        include: [{
            model: user, 
            as: 'Instructor', 
            attributes: ['id', 'first_name', 'last_name', 'email'] 
        }],
        order: [['scheduled_at', 'ASC']] 
    });

    if (userId) {
        for (let lessonItem of lessons) {
            lessonItem.dataValues.isFavorite = await isLessonFavoriteForUser(lessonItem.id, userId);
        }
    }
    return lessons;
};

const findUserRegisteredLessons = async (userId, startDate, endDate) => {
    console.log(`DAL-findUserRegisteredLessons: Fetching for user ${userId} between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    const lessons = await lesson.findAll({
        include: [{
            model: lesson_registrations,
            as: 'LessonRegistrations', 
            where: { user_id: userId },
            attributes: []
        }, { 
            model: user,
            as: 'Instructor', 
            attributes: ['id', 'first_name', 'last_name', 'email']
        }],
        where: {
            scheduled_at: { [Op.between]: [startDate, endDate] }
        },
        attributes: {
            include: [[sequelize.literal(`'joined'`), 'status']]
        }
    });
    if (userId) {
        for (let lessonItem of lessons) {
            lessonItem.dataValues.isFavorite = await isLessonFavoriteForUser(lessonItem.id, userId);
        }
    }
    return lessons;
};

const findUserWaitlistedLessons = async (userId, startDate, endDate) => {
    console.log(`DAL-findUserWaitlistedLessons: Fetching for user ${userId} between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    const lessons = await lesson.findAll({
        include: [{
            model: waiting_list,
            as: 'WaitingLists', 
            where: { user_id: userId },
            attributes: []
        }, { 
            model: user,
            as: 'Instructor', 
            attributes: ['id', 'first_name', 'last_name', 'email']
        }],
        where: {
            scheduled_at: { [Op.between]: [startDate, endDate] }
        },
        attributes: {
            include: [[sequelize.literal(`'waitlist'`), 'status']]
        }
    });
    if (userId) {
        for (let lessonItem of lessons) {
            lessonItem.dataValues.isFavorite = await isLessonFavoriteForUser(lessonItem.id, userId);
        }
    }
    return lessons;
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
            expires_at: { [Op.gt]: new Date() } 
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
    return updatedRows && updatedRows.length > 0;
};

const createLesson = async (lessonData) => {
    console.log('DAL-createLesson: Creating new lesson with data:', lessonData);
    return await lesson.create(lessonData);
};

const updateLessonData = async (lessonId, updatedData) => {
    console.log(`DAL-updateLessonData: Updating lesson ${lessonId} with data:`, updatedData);
    const [updatedRowsCount] = await lesson.update(updatedData, {
        where: { id: lessonId }
    });

    if (updatedRowsCount > 0) {
        const updatedLesson = await findLessonById(lessonId);
        console.log('DAL-updateLessonData: Lesson updated and fetched:', updatedLesson.toJSON());
        return updatedLesson; 
    }
    console.warn(`DAL-updateLessonData: No rows updated for lesson ID ${lessonId}. Lesson might not exist or no changes were made.`);
    return null; 
};

const deleteLessonById = async (lessonId) => {
    console.log(`DAL-deleteLessonById: Deleting lesson with ID: ${lessonId}`);
    const deletedRowsCount = await lesson.destroy({
        where: { id: lessonId }
    });
    return deletedRowsCount > 0;
};

// --- Favorite DAL Functions ---
const createFavorite = async (userId, lessonId) => {
    console.log(`DAL-createFavorite: Adding favorite for user ${userId}, lesson ${lessonId}`);
    try {
        const newFavorite = await favorite.create({ user_id: userId, lesson_id: lessonId });
        return newFavorite.toJSON();
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.warn(`DAL-createFavorite: Favorite already exists for user ${userId}, lesson ${lessonId}`);
            return { message: 'Favorite already exists' };
        }
        throw error; 
    }
};

const deleteFavorite = async (userId, lessonId) => {
    console.log(`DAL-deleteFavorite: Deleting favorite for user ${userId}, lesson ${lessonId}`);
    const deletedCount = await favorite.destroy({
        where: { user_id: userId, lesson_id: lessonId }
    });
    return deletedCount > 0;
};

const findUserFavoriteLessons = async (userId, weekStart, weekEnd) => { 
    if (!userId) {
        console.warn('DAL-findUserFavoriteLessons: called without userId.');
        return [];
    }

    console.log(`DAL-findUserFavoriteLessons: Fetching favorite entries for user ${userId} between ${weekStart.toISOString()} and ${weekEnd.toISOString()}`);

    const favoriteEntries = await favorite.findAll({
        where: { user_id: userId },
        include: [{
            model: lesson, 
            as: 'lesson', 
            required: true, 
            where: { 
                scheduled_at: {
                    [Op.between]: [weekStart, weekEnd] 
                }
            },
            include: [{ 
                model: user,
                as: 'Instructor',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }]
        }]
    });

    const lessons = favoriteEntries.map(entry => {
        const lessonData = entry.lesson.toJSON(); 
        lessonData.isFavorite = true; 
        return lessonData;
    });

    console.log(`DAL-findUserFavoriteLessons: Found ${lessons.length} favorite lessons for user ${userId} in week.`);
    return lessons;
};
const deleteExpiredReservedSpotsForLesson = async (lessonId) => {
    const deletedCount = await reserved_spot.destroy({
        where: {
            lesson_id: lessonId,
            expires_at: {
                [Op.lt]: new Date()
            }
        }
    });
    return deletedCount > 0;
};


// Export all functions at the end of the file
module.exports = {
    findLessonById,
    findLessonsByDateRange,
    findUserRegisteredLessons ,
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
    deleteLessonById,
    createFavorite,
    deleteFavorite,
    isLessonFavoriteForUser, 
    findUserFavoriteLessons,
    deleteExpiredReservedSpotsForLesson
};
