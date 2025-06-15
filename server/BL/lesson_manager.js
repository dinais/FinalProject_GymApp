const dal = require('../DAL/dal');
const { Op } = require('sequelize');
const { lesson, lesson_registrations, waiting_list } = require('../../DB/models');

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

    return dal.findAll(lesson, {
        include: [{
            model: lesson_registrations,
            where: {
                user_id: userId
            }
        }],
        where: {
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

    return dal.findAll(lesson, {
        include: [{
            model: waiting_list,
            where: {
                user_id: userId
            }
        }],
        where: {
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
        lesson_id: lessonItem.id
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
console.log(`Step 0: User ID: ${userId}, Lesson ID: ${lessonId}`);


  const theLesson = await lesson.findByPk(lessonId);
  console.log('Step 1: Lesson fetched', theLesson?.id);

  if (!theLesson) throw new Error('Lesson not found');

  // בדוק אם השיעור מלא
  if (theLesson.current_participants >= theLesson.max_participants) {
    throw new Error('Lesson is full');
  }
console.log('Step 2: Checking if full');

  // בדוק אם המשתמש כבר רשום
  const existingRegistration = await lesson_registrations.findOne({
    where: { user_id: userId, lesson_id: lessonId },
  });
console.log(existingRegistration);

  if (existingRegistration) {
    console.log("hi");
    
    throw new Error('User is already registered for this lesson');
  }
console.log('Step 3: Checking existing registration');

  // הסר מרשימת המתנה אם קיים
  await waiting_list.destroy({
    where: { user_id: userId, lesson_id: lessonId },
  });
  console.log('Step 4: Removing from waitlist');


  // רישום לשיעור
  await lesson_registrations.create({
    user_id: userId,
    lesson_id: lessonId,
    registration_date: new Date(),
  });
console.log('Step 5: Creating registration');

  // העלה את כמות הנרשמים בפועל
  await lesson.increment('current_participants', {
    by: 1,
    where: { id: lessonId },
  });
console.log('Step 6: Incrementing count');
  return { success: true, message: 'User successfully registered to lesson' };
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
            lesson_id: lessonId,
            user_id: userId,
            is_waitlist: false
        }
    });

    if (removedRegistered) {
        console.log(`Manager: User ${userId} cancelled registration for lesson ${lessonId}`);
        // If a spot opened up, check waitlist for the first in line
        const waitlist = await dal.findAll(lesson_registrations, {
            where: {
                lesson_id: lessonId,
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
            lesson_id: lessonId,
            user_id: userId,
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
