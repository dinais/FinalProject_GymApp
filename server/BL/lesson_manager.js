// BL/lesson_manager.js
const { Op } = require('sequelize'); // עדיין נחוץ עבור Op.between
const { sendEmail } = require('../services/mailer'); // ודא שהנתיב נכון

// ייבוא פונקציות ספציפיות מה-DAL החדש
const {
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
    findUserById, // לטובת שליחת מיילים
    updateLessonCurrentParticipants
} = require('../DAL/lesson_dal');

exports.getLessonsForWeek = async (weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7); // Calculate the end of the week (7 days from start)

    console.log(`Manager: Fetching lessons where scheduled_at is between ${start.toISOString()} and ${end.toISOString()}`);

    return await findLessonsByDateRange(start, end); // קריאה ל-DAL
};

exports.getUserRegisteredAndWaitlistedLessons = async (userId, weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    console.log(`Manager: Fetching registered and waitlisted lessons for user ${userId} for week starting ${weekStart}`);

    const registeredLessons = await findUserRegisteredLessons(userId, start, end); // קריאה ל-DAL
    const waitlistedLessons = await findUserWaitlistedLessons(userId, start, end); // קריאה ל-DAL

    // נאחד את שתי הרשימות ונוודא שאין כפילויות
    const allUserLessonsMap = new Map();
    registeredLessons.forEach(l => allUserLessonsMap.set(l.id, l.toJSON()));
    waitlistedLessons.forEach(l => allUserLessonsMap.set(l.id, l.toJSON()));

    const combinedLessons = Array.from(allUserLessonsMap.values());

    // עבור כל שיעור, נביא את כמות המשתתפים הנוכחית
    for (const lessonItem of combinedLessons) {
        const registeredCount = await countLessonRegistrations(lessonItem.id); // קריאה ל-DAL
        lessonItem.current_participants = registeredCount;
    }

    return combinedLessons;
};

exports.getUserLessons = async (userId, weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return await findUserRegisteredLessons(userId, start, end); // קריאה ל-DAL
};

exports.getUserWaitlistedLessons = async (userId, weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return await findUserWaitlistedLessons(userId, start, end); // קריאה ל-DAL
};

exports.getRegisteredCounts = async (weekStart) => {
    console.log(`Manager: Calculating registered counts for lessons starting week of ${weekStart}`);
    const lessonsInWeek = await exports.getLessonsForWeek(weekStart); // שימוש בפונקציה קיימת ב-BL
    const counts = {};

    for (const lessonItem of lessonsInWeek) {
        const participantsCount = await countLessonRegistrations(lessonItem.id); // קריאה ל-DAL
        counts[lessonItem.id] = participantsCount;
    }

    return counts;
};

exports.joinLesson = async (userId, lessonId) => {
    console.log(`Manager: User ${userId} attempting to join lesson ${lessonId}`);

    const theLesson = await findLessonById(lessonId); // קריאה ל-DAL
    if (!theLesson) {
        return { success: false, message: 'Lesson not found' };
    }

    // ניקוי שמורות שפגו
    await deleteReservedSpot({ // קריאה ל-DAL
        lesson_id: lessonId,
        expires_at: { [Op.lt]: new Date() }
    });

    // מביא את כל השמורות בתוקף לשיעור
    const reservedSpots = await findActiveReservedSpots(lessonId); // קריאה ל-DAL

    // בדיקה אם המשתמש כבר רשום
    const existingRegistration = await findLessonRegistration(userId, lessonId); // קריאה ל-DAL
    if (existingRegistration) {
        return { success: false, message: 'User is already registered for this lesson' };
    }

    // בדיקה אם המשתמש כבר ברשימת המתנה
    const existingWaitlist = await findWaitingListItem(userId, lessonId); // קריאה ל-DAL

    const registeredCount = await countLessonRegistrations(lessonId); // קריאה ל-DAL

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
                await deleteWaitingListItem(userId, lessonId); // קריאה ל-DAL
            }
            await deleteReservedSpot({ user_id: userId, lesson_id: lessonId }); // קריאה ל-DAL
            await createLessonRegistration(userId, lessonId); // קריאה ל-DAL
            await updateLessonCurrentParticipants(lessonId, 1); // קריאה ל-DAL
            return { success: true, message: 'User successfully registered with reservation', status: 'joined' };
        }

        // אין מקום ואין שמורה
        // אם המשתמש כבר ברשימת המתנה נחזיר הודעה מתאימה, אחרת נוסיף אותו
        if (!existingWaitlist) {
            await createWaitingListItem(userId, lessonId); // קריאה ל-DAL
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
                await deleteWaitingListItem(userId, lessonId); // קריאה ל-DAL
            }

            await deleteReservedSpot({ user_id: userId, lesson_id: lessonId }); // קריאה ל-DAL

            await createLessonRegistration(userId, lessonId); // קריאה ל-DAL
            await updateLessonCurrentParticipants(lessonId, 1); // קריאה ל-DAL

            return { success: true, message: 'User successfully registered with reservation', status: 'joined' };
        } else {
            // למשתמש אין שמורה - נבדוק אם יש מקומות פנויים מעבר לשמורות
            const spotsForNonReserved = totalSpotsLeft - reservedCount;

            if (spotsForNonReserved > 0) {
                // יש מקום למשתמשים ללא שמורה להירשם
                if (existingWaitlist) {
                    await deleteWaitingListItem(userId, lessonId); // קריאה ל-DAL
                }

                await createLessonRegistration(userId, lessonId); // קריאה ל-DAL
                await updateLessonCurrentParticipants(lessonId, 1); // קריאה ל-DAL

                return { success: true, message: 'User successfully registered', status: 'joined' };
            } else {
                // אין מקום למשתמשים ללא שמורה - הוסף לרשימת המתנה, רק אם לא קיים כבר
                if (!existingWaitlist) {
                    await createWaitingListItem(userId, lessonId); // קריאה ל-DAL
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
            await deleteWaitingListItem(userId, lessonId); // קריאה ל-DAL
        }

        await createLessonRegistration(userId, lessonId); // קריאה ל-DAL
        await updateLessonCurrentParticipants(lessonId, 1); // קריאה ל-DAL

        return { success: true, message: 'User successfully registered', status: 'joined' };
    }

    // 4. ברירת מחדל - אי אפשר להירשם
    return { success: false, message: 'Registration is not allowed at this time', status: 'not_allowed' };
};

exports.cancelLesson = async (userId, lessonId) => {
    console.log(`Manager: User ${userId} attempting to cancel lesson ${lessonId}`);

    const removedRegistered = await deleteLessonRegistration(userId, lessonId); // קריאה ל-DAL

    if (removedRegistered) {
        console.log(`Manager: User ${userId} cancelled registration for lesson ${lessonId}`);

        await updateLessonCurrentParticipants(lessonId, -1); // קריאה ל-DAL

        // מישהו בהמתנה?
        const waitlist = await findFirstInWaitlist(lessonId); // קריאה ל-DAL

        if (waitlist.length > 0) {
            const firstInLine = waitlist[0];

            await deleteWaitingListItem(firstInLine.user_id, lessonId); // קריאה ל-DAL

            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 דקות קדימה

            await createReservedSpot(firstInLine.user_id, lessonId, expiresAt); // קריאה ל-DAL

            const user_model = await findUserById(firstInLine.user_id); // קריאה ל-DAL
            const lessonObj = await findLessonById(lessonId); // קריאה ל-DAL

            const subject = 'התפנה מקום בשיעור';

            const text = `שלום ${user_model.first_name || ''},\n\nהתפנה מקום בשיעור "${lessonObj.lesson_type}". שמרנו לך מקום עד השעה ${expiresAt.toLocaleTimeString('he-IL')}.\nהיכנס/י לאפליקציה כדי להשלים את ההרשמה.\n\nבהצלחה!`;

            // שליחת מייל למשתמש
            console.log(`Sending email to: ${user_model.email}`);
            await sendEmail(user_model.email, subject, text);

            console.log(`Manager: Reserved spot created and email sent to user ${firstInLine.user_id}`);
        }

        return { status: 'cancelled_from_registered' };
    }

    // אם לא היה רשום – ננסה למחוק מרשימת המתנה
    const removedWaitlist = await deleteWaitingListItem(userId, lessonId); // קריאה ל-DAL

    if (removedWaitlist) {
        console.log(`Manager: User ${userId} cancelled from waitlist for lesson ${lessonId}`);
        return { status: 'cancelled_from_waitlist' };
    }

    console.log(`Manager: User ${userId} not found in registered or waitlist for lesson ${lessonId}`);
    return { status: 'not_found' };
};