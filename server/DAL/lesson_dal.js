// DAL/lesson_dal.js
const { Op } = require('sequelize');
const { lesson, lesson_registrations, waiting_list, reserved_spot, user } = require('../../DB/models'); // ייבוא המודלים הרלוונטיים
const { sequelize } = require('../../DB/models'); // ✅

module.exports.findLessonById = async (lessonId) => {
    return await lesson.findByPk(lessonId);
};

module.exports.findLessonsByDateRange = async (startDate, endDate) => {
    return await lesson.findAll({
        where: {
            scheduled_at: {
                [Op.between]: [startDate, endDate]
            }
        }
    });
};

module.exports.findUserRegisteredLessons = async (userId, startDate, endDate) => {
    return await lesson.findAll({
        include: [{
            model: lesson_registrations,
            as: 'LessonRegistrations',
            where: { user_id: userId },
            attributes: []
        }],
        where: {
            scheduled_at: { [Op.between]: [startDate, endDate] }
        },
        attributes: {
            include: [[sequelize.literal(`'joined'`), 'status']]
        }
    });
};

module.exports.findUserWaitlistedLessons = async (userId, startDate, endDate) => {
    return await lesson.findAll({
        include: [{
            model: waiting_list,
            as: 'WaitingLists',
            where: { user_id: userId },
            attributes: []
        }],
        where: {
            scheduled_at: { [Op.between]: [startDate, endDate] }
        },
        attributes: {
            include: [[sequelize.literal(`'waitlist'`), 'status']]
        }
    });
};

module.exports.countLessonRegistrations = async (lessonId) => {
    return await lesson_registrations.count({
        where: { lesson_id: lessonId }
    });
};

module.exports.findLessonRegistration = async (userId, lessonId) => {
    return await lesson_registrations.findOne({
        where: { user_id: userId, lesson_id: lessonId }
    });
};

module.exports.createLessonRegistration = async (userId, lessonId) => {
    return await lesson_registrations.create({
        user_id: userId,
        lesson_id: lessonId,
        registration_date: new Date()
    });
};

module.exports.findWaitingListItem = async (userId, lessonId) => {
    return await waiting_list.findOne({
        where: { user_id: userId, lesson_id: lessonId }
    });
};

module.exports.createWaitingListItem = async (userId, lessonId) => {
    return await waiting_list.create({
        user_id: userId,
        lesson_id: lessonId,
        date: new Date()
    });
};

module.exports.deleteLessonRegistration = async (userId, lessonId) => {
    const deletedCount = await lesson_registrations.destroy({
        where: { user_id: userId, lesson_id: lessonId }
    });
    return deletedCount > 0;
};

module.exports.deleteWaitingListItem = async (userId, lessonId) => {
    const deletedCount = await waiting_list.destroy({
        where: { user_id: userId, lesson_id: lessonId }
    });
    return deletedCount > 0;
};

module.exports.findFirstInWaitlist = async (lessonId) => {
    return await waiting_list.findAll({
        where: { lesson_id: lessonId },
        order: [['date', 'ASC']],
        limit: 1
    });
};

module.exports.deleteReservedSpot = async (whereClause) => {
    const deletedCount = await reserved_spot.destroy({ where: whereClause });
    return deletedCount > 0;
};

module.exports.createReservedSpot = async (userId, lessonId, expiresAt) => {
    return await reserved_spot.create({
        user_id: userId,
        lesson_id: lessonId,
        expires_at: expiresAt
    });
};

module.exports.findActiveReservedSpots = async (lessonId) => {
    return await reserved_spot.findAll({
        where: {
            lesson_id: lessonId,
            expires_at: { [Op.gt]: new Date() } // גדול מתאריך ושעה נוכחיים
        }
    });
};

module.exports.findUserById = async (userId) => {
    return await user.findByPk(userId);
};

module.exports.updateLessonCurrentParticipants = async (lessonId, change) => {
    const [updatedRows] = await lesson.increment('current_participants', {
        by: change,
        where: { id: lessonId }
    });
    // בדוק אם השינוי נשמר בהצלחה (updatedRows הוא מערך, ו-updatedRows[0] הוא המשתתף המעודכן)
    return updatedRows && updatedRows.length > 0;
};