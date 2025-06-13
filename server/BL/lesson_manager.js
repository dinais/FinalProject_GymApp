const dal = require('../DAL/dal');
const { lesson, lesson_registrations } = require('../../DB/models');
const { Op } = require('sequelize');

/**
 * Retrieves all lessons for a given week.
 * Lessons are filtered by their 'start_date' falling within the specified week.
 * @param {string} weekStart - The ISO string representing the start of the week (e.g., '2025-06-01T00:00:00.000Z').
 * @returns {Promise<Array>} A promise that resolves to an array of lesson objects.
 */
exports.getLessonsForWeek = async (weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7); // Calculate the end of the week (7 days from start)

    console.log(`Manager: Fetching lessons where start_date is between ${start.toISOString()} and ${end.toISOString()}`);

    return dal.findAll(lesson, {
        where: {
            // FIX: Changed 'date' to 'start_date' to match the Lesson model and DB schema
            start_date: {
                [Op.between]: [start, end]
            }
        }
    });
};

/**
 * Retrieves lessons a specific user is registered for within a given week.
 * @param {number} userId - The ID of the user.
 * @param {string} weekStart - The ISO string representing the start of the week.
 * @returns {Promise<Array>} A promise that resolves to an array of lesson objects the user is registered for.
 */
exports.getUserLessons = async (userId, weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    console.log(`Manager: Fetching user ${userId} registered lessons where start_date is between ${start.toISOString()} and ${end.toISOString()}`);

    return dal.findAll(lesson, {
        include: [{
            model: lesson_registrations,
            where: {
                userId,
                is_waitlist: false
            }
        }],
        where: {
            // FIX: Changed 'date' to 'start_date' to match the Lesson model and DB schema
            start_date: {
                [Op.between]: [start, end]
            }
        }
    });
};

/**
 * Retrieves lessons a specific user is waitlisted for within a given week.
 * @param {number} userId - The ID of the user.
 * @param {string} weekStart - The ISO string representing the start of the week.
 * @returns {Promise<Array>} A promise that resolves to an array of lesson objects the user is waitlisted for.
 */
exports.getUserWaitlistedLessons = async (userId, weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    console.log(`Manager: Fetching user ${userId} waitlisted lessons where start_date is between ${start.toISOString()} and ${end.toISOString()}`);

    return dal.findAll(lesson, {
        include: [{
            model: lesson_registrations,
            where: {
                userId,
                is_waitlist: true
            }
        }],
        where: {
            // FIX: Changed 'date' to 'start_date' to match the Lesson model and DB schema
            start_date: {
                [Op.between]: [start, end]
            }
        }
    });
};

/**
 * Calculates the number of registered participants for each lesson within a given week.
 * @param {string} weekStart - The ISO string representing the start of the week.
 * @returns {Promise<Object>} A promise that resolves to an object mapping lesson IDs to their registered participant counts.
 */
exports.getRegisteredCounts = async (weekStart) => {
    console.log(`Manager: Calculating registered counts for lessons starting week of ${weekStart}`);
    const lessonsInWeek = await exports.getLessonsForWeek(weekStart); // This now correctly uses start_date
    const counts = {};

    for (const lessonItem of lessonsInWeek) { // FIX: Renamed 'lesson' to 'lessonItem' to avoid conflict with imported model
        const participants = await dal.findAll(lesson_registrations, {
            where: {
                lessonId: lessonItem.id, // Use lessonItem's ID
                is_waitlist: false
            }
        });
        counts[lessonItem.id] = participants.length;
    }

    return counts;
};

/**
 * Handles a user joining a lesson.
 * Checks capacity and either registers the user or adds them to the waitlist.
 * @param {number} userId - The ID of the user joining.
 * @param {number} lessonId - The ID of the lesson to join.
 * @returns {Promise<Object>} An object indicating the status of the join operation ('joined', 'waitlist', 'already_joined', 'already_waitlist', 'not_found').
 */
exports.joinLesson = async (userId, lessonId) => {
    console.log(`Manager: User ${userId} attempting to join lesson ${lessonId}`);
    const currentLesson = await dal.findById(lesson, lessonId); // Renamed user_lesson to currentLesson
    if (!currentLesson) return { status: 'not_found' }; // FIX: Changed 'lesson' to 'currentLesson'

    const registered = await dal.findAll(lesson_registrations, {
        where: {
            lessonId,
            userId, // Include userId in where clause to find specific registration
            is_waitlist: false
        }
    });

    const waitlisted = await dal.findAll(lesson_registrations, {
        where: {
            lessonId,
            userId, // Include userId in where clause to find specific waitlist entry
            is_waitlist: true
        }
    });

    // Check if already registered or waitlisted by the user
    if (registered.length > 0) return { status: 'already_joined' };
    if (waitlisted.length > 0) return { status: 'already_waitlist' };

    // Get total registered count for the lesson
    const currentRegisteredCount = await dal.findAll(lesson_registrations, {
        where: {
            lessonId,
            is_waitlist: false
        }
    });

    if (currentRegisteredCount.length < currentLesson.max_participants) {
        // FIX: Changed 'LessonParticipant' to 'lesson_registrations'
        await dal.create(lesson_registrations, { lessonId, userId, is_waitlist: false });
        console.log(`Manager: User ${userId} successfully joined lesson ${lessonId}`);
        return { status: 'joined' };
    } else {
        // FIX: Changed 'LessonParticipant' to 'lesson_registrations'
        await dal.create(lesson_registrations, { lessonId, userId, is_waitlist: true });
        console.log(`Manager: User ${userId} added to waitlist for lesson ${lessonId}`);
        return { status: 'waitlist' };
    }
};

/**
 * Handles a user cancelling their lesson registration or waitlist entry.
 * If a registered user cancels, the first person on the waitlist (if any) is moved to registered.
 * @param {number} userId - The ID of the user cancelling.
 * @param {number} lessonId - The ID of the lesson to cancel.
 * @returns {Promise<Object>} An object indicating the status of the cancellation ('cancelled_from_registered', 'cancelled_from_waitlist', 'not_found').
 */
exports.cancelLesson = async (userId, lessonId) => {
    console.log(`Manager: User ${userId} attempting to cancel lesson ${lessonId}`);

    // Try to remove from registered participants first
    const removedRegistered = await dal.remove(lesson_registrations, {
        where: {
            lessonId,
            userId,
            is_waitlist: false
        }
    });

    if (removedRegistered) {
        console.log(`Manager: User ${userId} cancelled registration for lesson ${lessonId}`);
        // If a spot opened up, check waitlist for the first in line
        const waitlist = await dal.findAll(lesson_registrations, {
            where: {
                lessonId,
                is_waitlist: true
            },
            order: [['registration_date', 'ASC']], // Order by registration_date for true FIFO waitlist
            limit: 1
        });

        if (waitlist.length > 0) {
            const firstInLine = waitlist[0];
            // FIX: Changed 'LessonParticipant' to 'lesson_registrations'
            await dal.update(lesson_registrations, firstInLine.id, { is_waitlist: false });
            console.log(`Manager: Moved user ${firstInLine.userId} from waitlist to registered for lesson ${lessonId}`);
        }

        return { status: 'cancelled_from_registered' };
    }

    // If not found in registered, try to remove from waitlist
    const removedWaitlist = await dal.remove(lesson_registrations, {
        where: {
            lessonId,
            userId,
            is_waitlist: true
        }
    });

    if (removedWaitlist) {
        console.log(`Manager: User ${userId} cancelled from waitlist for lesson ${lessonId}`);
        return { status: 'cancelled_from_waitlist' };
    }

    console.log(`Manager: User ${userId} not found in registered or waitlist for lesson ${lessonId}`);
    return { status: 'not_found' };
};
