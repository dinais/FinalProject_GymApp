const dal = require('../DAL/dal');
const { Op } = require('sequelize');
const { lesson, lesson_registrations, waiting_list, user, reserved_spot } = require('../../DB/models');
const { sendEmail } = require('../services/mailer'); // תעדכן לפי הנתיב שלך

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
      start_date: {
        [Op.between]: [start, end]
      }
    }
  });
};

// *** פונקציה עבור "השיעורים שלי" ***
/**
 * Retrieves all lessons (both registered and waitlisted) for a specific user within a given week,
 * along with their current registration status and participant counts.
 * @param {number} userId - The ID of the user.
 * @param {string} weekStart - The ISO string representing the start of the week.
 * @returns {Promise<Array>} A promise that resolves to an array of lesson objects
 * with 'status' ('joined'/'waitlist') and 'current_participants'.
 */
exports.getUserRegisteredAndWaitlistedLessons = async (userId, weekStart) => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  console.log(`Manager: Fetching registered and waitlisted lessons for user ${userId} for week starting ${weekStart}`);

  const registeredLessons = await dal.findAll(lesson, {
    include: [{
      model: lesson_registrations,
      where: {
        user_id: userId
      },
      attributes: [] // לא רוצים להחזיר שדות מטבלת הרישומים עצמה
    }],
    where: {
      start_date: {
        [Op.between]: [start, end]
      }
    },
    attributes: [ // נבחר במפורש את השדות שאנחנו רוצים
      'id', 'lesson_type', 'hours', 'day', 'room_number', 'max_participants', 'start_date',
      // נוסיף שדה סטטוס קבוע עבור רישומים
      // *** תיקון כאן: שימוש ב-lesson.sequelize.literal ***
      [lesson.sequelize.literal("'joined'"), 'status'] 
    ]
  });

  const waitlistedLessons = await dal.findAll(lesson, {
    include: [{
      model: waiting_list,
      where: {
        user_id: userId
      },
      attributes: [] // לא רוצים להחזיר שדות מטבלת רשימת ההמתנה
    }],
    where: {
      start_date: {
        [Op.between]: [start, end]
      }
    },
    attributes: [ // נבחר במפורש את השדות שאנחנו רוצים
      'id', 'lesson_type', 'hours', 'day', 'room_number', 'max_participants', 'start_date',
      // נוסיף שדה סטטוס קבוע עבור רשימת המתנה
      // *** תיקון כאן: שימוש ב-lesson.sequelize.literal ***
      [lesson.sequelize.literal("'waitlist'"), 'status']
    ]
  });

  // נאחד את שתי הרשימות ונוודא שאין כפילויות (למקרה של באג, למרות שלא אמור לקרות)
  const allUserLessonsMap = new Map();
  registeredLessons.forEach(l => allUserLessonsMap.set(l.id, l.toJSON())); // toJSON כדי לקבל אובייקט רגיל
  waitlistedLessons.forEach(l => allUserLessonsMap.set(l.id, l.toJSON()));

  const combinedLessons = Array.from(allUserLessonsMap.values());

  // עבור כל שיעור, נביא את כמות המשתתפים הנוכחית
  for (const lessonItem of combinedLessons) {
    const registeredCount = await lesson_registrations.count({
      where: { lesson_id: lessonItem.id }
    });
    lessonItem.current_participants = registeredCount;
  }
  
  return combinedLessons;
};


/**
 * Retrieves lessons a specific user is registered for within a given week.
 * @param {number} userId - The ID of the user.
 * @param {string} weekStart - The ISO string representing the start of the week.
 * @returns {Promise<Array>} A promise that resolves to an array of lesson objects the user is registered for.
 * @deprecated - Use getUserRegisteredAndWaitlistedLessons instead for "My Lessons" view.
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
 * @deprecated - Use getUserRegisteredAndWaitlistedLessons instead for "My Lessons" view.
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

  for (const lessonItem of lessonsInWeek) {
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

  const theLesson = await lesson.findByPk(lessonId);
  if (!theLesson) {
    return { success: false, message: 'Lesson not found' };
  }

  // ניקוי שמורות שפגו
  await reserved_spot.destroy({
    where: {
      lesson_id: lessonId,
      expires_at: { [Op.lt]: new Date() }
    }
  });

  // מביא את כל השמורות בתוקף לשיעור
  const reservedSpots = await reserved_spot.findAll({
    where: {
      lesson_id: lessonId,
      expires_at: { [Op.gt]: new Date() }
    }
  });

  // בדיקה אם המשתמש כבר רשום
  const existingRegistration = await lesson_registrations.findOne({
    where: { user_id: userId, lesson_id: lessonId }
  });
  if (existingRegistration) {
    return { success: false, message: 'User is already registered for this lesson' };
  }

  // בדיקה אם המשתמש כבר ברשימת המתנה
  const existingWaitlist = await waiting_list.findOne({
    where: { user_id: userId, lesson_id: lessonId }
  });

  const registeredCount = await lesson_registrations.count({
    where: { lesson_id: lessonId }
  });

  const maxParticipants = theLesson.max_participants;
  const reservedCount = reservedSpots.length;

  const userHasReservation = reservedSpots.some(rs => rs.user_id === userId);

  const totalSpotsLeft = maxParticipants - registeredCount;

  // 1. אם אין מקום בכלל
  if (totalSpotsLeft <= 0) {
    // אם המשתמש עם שמורה, אולי אפשר להירשם, אחרת לדחות
    if (userHasReservation) {
      // משתמש עם שמורה רשאי להירשם
      if (existingWaitlist) {
        await waiting_list.destroy({ where: { user_id: userId, lesson_id: lessonId } });
      }
      await reserved_spot.destroy({ where: { user_id: userId, lesson_id: lessonId } });
      await lesson_registrations.create({
        user_id: userId,
        lesson_id: lessonId,
        registration_date: new Date()
      });
      // עדכון כמות משתתפים בשיעור
      await lesson.increment('current_participants', {
        by: 1,
        where: { id: lessonId }
      });
      return { success: true, message: 'User successfully registered with reservation', status: 'joined' };
    }

    // אין מקום ואין שמורה
    // אם המשתמש כבר ברשימת המתנה נחזיר הודעה מתאימה, אחרת נוסיף אותו
    if (!existingWaitlist) {
      await waiting_list.create({
        user_id: userId,
        lesson_id: lessonId,
        date: new Date()
      });
      return { success: false, message: 'Lesson is full. User added to waitlist', status: 'waitlist' };
    } else {
      return { success: false, message: 'User is already in the waitlist for this lesson', status: 'already_waitlist' };
    }
  }

  // 2. אם יש שמורות בתוקף
  if (reservedCount > 0) {
    if (userHasReservation) {
      // המשתמש עם שמורה - ניתן להירשם מיד
      if (existingWaitlist) {
        await waiting_list.destroy({ where: { user_id: userId, lesson_id: lessonId } });
      }

      await reserved_spot.destroy({
        where: { user_id: userId, lesson_id: lessonId }
      });

      await lesson_registrations.create({
        user_id: userId,
        lesson_id: lessonId,
        registration_date: new Date()
      });
      // עדכון כמות משתתפים בשיעור
      await lesson.increment('current_participants', {
        by: 1,
        where: { id: lessonId }
      });

      return { success: true, message: 'User successfully registered with reservation', status: 'joined' };
    } else {
      // למשתמש אין שמורה - נבדוק אם יש מקומות פנויים מעבר לשמורות
      const spotsForNonReserved = totalSpotsLeft - reservedCount;

      if (spotsForNonReserved > 0) {
        // יש מקום למשתמשים ללא שמורה להירשם
        if (existingWaitlist) {
          await waiting_list.destroy({ where: { user_id: userId, lesson_id: lessonId } });
        }

        await lesson_registrations.create({
          user_id: userId,
          lesson_id: lessonId,
          registration_date: new Date()
        });
        // עדכון כמות משתתפים בשיעור
        await lesson.increment('current_participants', {
          by: 1,
          where: { id: lessonId }
        });

        return { success: true, message: 'User successfully registered', status: 'joined' };
      } else {
        // אין מקום למשתמשים ללא שמורה - הוסף לרשימת המתנה, רק אם לא קיים כבר
        if (!existingWaitlist) {
          await waiting_list.create({
            user_id: userId,
            lesson_id: lessonId,
            date: new Date()
          });
          return { success: false, message: 'Lesson is full due to reserved spots. User added to waitlist', status: 'waitlist' };
        } else {
          return { success: false, message: 'User is already in the waitlist for this lesson', status: 'already_waitlist' };
        }
      }
    }
  }

  // 3. אין שמורות בכלל - משתמש יכול להירשם כל עוד יש מקום
  if (totalSpotsLeft > 0) {
    if (existingWaitlist) {
      await waiting_list.destroy({ where: { user_id: userId, lesson_id: lessonId } });
    }

    await lesson_registrations.create({
      user_id: userId,
      lesson_id: lessonId,
      registration_date: new Date()
    });
    // עדכון כמות משתתפים בשיעור
    await lesson.increment('current_participants', {
      by: 1,
      where: { id: lessonId }
    });

    return { success: true, message: 'User successfully registered', status: 'joined' };
  }

  // 4. ברירת מחדל - אי אפשר להירשם
  return { success: false, message: 'Registration is not allowed at this time', status: 'not_allowed' };
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

  const removedRegistered = await dal.removeWhere(lesson_registrations, {
    lesson_id: lessonId,
    user_id: userId
  });

  if (removedRegistered) {
    console.log(`Manager: User ${userId} cancelled registration for lesson ${lessonId}`);

    // עדכון כמות משתתפים בשיעור
    await lesson.decrement('current_participants', {
      by: 1,
      where: { id: lessonId }
    });

    // מישהו בהמתנה?
    const waitlist = await waiting_list.findAll({
      where: { lesson_id: lessonId },
      order: [['date', 'ASC']],
      limit: 1
    });

    if (waitlist.length > 0) {
      const firstInLine = waitlist[0];

      await waiting_list.destroy({ where: { id: firstInLine.id } });

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 דקות קדימה

      await reserved_spot.create({
        user_id: firstInLine.user_id,
        lesson_id: lessonId,
        expires_at: expiresAt
      });

      const user_model = await user.findByPk(firstInLine.user_id);
      const lessonObj = await lesson.findByPk(lessonId);

      const subject = 'התפנה מקום בשיעור';

      const text = `שלום ${user_model.first_name || ''},\n\nהתפנה מקום בשיעור "${lessonObj.lesson_type}". שמרנו לך מקום עד השעה ${expiresAt.toLocaleTimeString('he-IL')}.\nהיכנס/י לאפליקציה כדי להשלים את ההרשמה.\n\nבהצלחה!`; // שיניתי לפורמט ישראלי

      // שליחת מייל למשתמש
      console.log(`Sending email to: ${user_model.email}`);
      // ודא שפונקציית sendEmail קיימת ופועלת
      await sendEmail(user_model.email, subject, text);

      console.log(`Manager: Reserved spot created and email sent to user ${firstInLine.user_id}`);
    }

    return { status: 'cancelled_from_registered' };
  }

  // אם לא היה רשום – ננסה למחוק מרשימת המתנה
  const removedWaitlist = await dal.removeWhere(waiting_list, {
    lesson_id: lessonId,
    user_id: userId
  });

  if (removedWaitlist) {
    console.log(`Manager: User ${userId} cancelled from waitlist for lesson ${lessonId}`);
    return { status: 'cancelled_from_waitlist' };
  }

  console.log(`Manager: User ${userId} not found in registered or waitlist for lesson ${lessonId}`);
  return { status: 'not_found' };
};