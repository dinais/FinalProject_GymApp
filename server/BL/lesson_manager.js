// BL/lesson_manager.js
const { Op } = require('sequelize');
const { sendEmail } = require('../services/mailer'); 

// Import all necessary DAL functions, including new favorite ones
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
    findUserById,
    updateLessonCurrentParticipants,
    createLesson,
    updateLessonData,
    deleteLessonById,
    // --- New Favorite DAL Functions ---
    createFavorite,
    deleteFavorite,
    findUserFavoriteLessons // New DAL function for favorites list
} = require('../DAL/lesson_dal');

// Helper function to get day of the week name based on UTC date
// This ensures consistency since scheduled_at is stored as UTC.
const getDayOfWeekName = (dateString) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; // English day names
    const date = new Date(dateString); // Creates a Date object from UTC ISO string

    if (isNaN(date.getTime())) {
        console.error('getDayOfWeekName: Invalid date string provided:', dateString);
        return 'Invalid Day'; // Handle invalid date gracefully
    }
    
    // Use getUTCDay() to get the day of the week in UTC, which matches the UTC storage.
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return days[date.getUTCDay()];
};

const getLessonsForWeek = async (weekStart, userId = null) => { // Added userId parameter
    const start = new Date(weekStart); // weekStart should be UTC ISO string from frontend
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    console.log(`Manager: Fetching lessons where scheduled_at is between ${start.toISOString()} and ${end.toISOString()} (UTC) for user ${userId || 'N/A'}`);
    
    // Pass userId to DAL to get isFavorite flag
    const lessons = await findLessonsByDateRange(start, end, userId); 
    return lessons.map(lesson => lesson.toJSON()); 
};

const getUserRegisteredAndWaitlistedLessons = async (userId, weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid weekly start date.");
    }

    console.log(`Manager: Fetching registered and waitlisted lessons for user ${userId} for week starting ${weekStart}`);

    // DAL functions already modified to include isFavorite
    const registeredLessons = (await findUserRegisteredLessons(userId, start, end)).map(l => l.toJSON());
    const waitlistedLessons = (await findUserWaitlistedLessons(userId, start, end)).map(l => l.toJSON());

    const allUserLessonsMap = new Map();
    registeredLessons.forEach(l => {
        if (l) allUserLessonsMap.set(l.id, l);
    });
    waitlistedLessons.forEach(l => {
        if (l) allUserLessonsMap.set(l.id, l);
    });

    const combinedLessons = Array.from(allUserLessonsMap.values());

    await Promise.all(combinedLessons.map(async (lessonItem) => {
        const registeredCount = await countLessonRegistrations(lessonItem.id);
        lessonItem.current_participants = registeredCount;
    }));

    return combinedLessons;
};

const getUserLessons = async (userId, weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    // DAL function already modified to include isFavorite
    return (await findUserRegisteredLessons(userId, start, end)).map(l => l.toJSON());
};

const getUserWaitlistedLessons = async (userId, weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    // DAL function already modified to include isFavorite
    return (await findUserWaitlistedLessons(userId, start, end)).map(l => l.toJSON());
};

const getRegisteredCounts = async (weekStart) => {
    console.log(`Manager: Calculating registered counts for lessons starting week of ${weekStart}`);
    // Pass null for userId as this function doesn't need favorite status
    const lessonsInWeek = await getLessonsForWeek(weekStart, null); 
    const counts = {};

    for (const lessonItem of lessonsInWeek) {
        if (lessonItem && lessonItem.id) {
            const participantsCount = await countLessonRegistrations(lessonItem.id);
            counts[lessonItem.id] = participantsCount;
        } else {
            console.warn("Warning: Lesson item missing ID in getRegisteredCounts loop:", lessonItem);
        }
    }
    return counts;
};

const joinLesson = async (userId, lessonId) => {
    console.log(`Manager: User ${userId} attempting to join lesson ${lessonId}`);

    const theLesson = await findLessonById(lessonId);
    if (!theLesson) {
        return { success: false, message: 'Lesson not found.' };
    }

    await deleteReservedSpot({
        lesson_id: lessonId,
        expires_at: { [Op.lt]: new Date() } // Delete expired spots
    });

    const reservedSpots = await findActiveReservedSpots(lessonId);
    const existingRegistration = await findLessonRegistration(userId, lessonId);
    if (existingRegistration) {
        return { success: false, message: 'User is already registered for this lesson.' };
    }

    const existingWaitlist = await findWaitingListItem(userId, lessonId);
    const registeredCount = await countLessonRegistrations(lessonId);
    const maxParticipants = theLesson.max_participants; 
    const reservedCount = reservedSpots.length;
    const userHasReservation = reservedSpots.some(rs => rs.user_id === userId);
    const totalSpotsLeft = maxParticipants - registeredCount;

    if (totalSpotsLeft <= 0) {
        if (userHasReservation) {
            if (existingWaitlist) {
                await deleteWaitingListItem(userId, lessonId);
            }
            await deleteReservedSpot({ user_id: userId, lesson_id: lessonId });
            await createLessonRegistration(userId, lessonId);
            await updateLessonCurrentParticipants(lessonId, 1);
            return { success: true, message: 'User successfully registered with a reservation.', status: 'joined' };
        }

        if (!existingWaitlist) {
            await createWaitingListItem(userId, lessonId);
            return { success: false, message: 'Lesson is full. User added to waitlist.', status: 'waitlist' };
        } else {
            return { success: false, message: 'User is already on the waitlist for this lesson.', status: 'already_waitlist' };
        }
    }

    if (reservedCount > 0) {
        if (userHasReservation) {
            if (existingWaitlist) {
                await deleteWaitingListItem(userId, lessonId);
            }
            await deleteReservedSpot({ user_id: userId, lesson_id: lessonId });
            await createLessonRegistration(userId, lessonId);
            await updateLessonCurrentParticipants(lessonId, 1);
            return { success: true, message: 'User successfully registered with a reservation.', status: 'joined' };
        } else {
            const spotsForNonReserved = totalSpotsLeft - reservedCount;
            if (spotsForNonReserved > 0) {
                if (existingWaitlist) {
                    await deleteWaitingListItem(userId, lessonId);
                }
                await createLessonRegistration(userId, lessonId);
                await updateLessonCurrentParticipants(lessonId, 1);
                return { success: true, message: 'User successfully registered.', status: 'joined' };
            } else {
                if (!existingWaitlist) {
                    await createWaitingListItem(userId, lessonId);
                    return { success: false, message: 'Lesson is full due to reserved spots. User added to waitlist.', status: 'waitlist' };
                } else {
                    return { success: false, message: 'User is already on the waitlist for this lesson.', status: 'already_waitlist' };
                }
            }
        }
    }

    if (totalSpotsLeft > 0) {
        if (existingWaitlist) {
            await deleteWaitingListItem(userId, lessonId);
        }
        await createLessonRegistration(userId, lessonId);
        await updateLessonCurrentParticipants(lessonId, 1);
        return { success: true, message: 'User successfully registered.', status: 'joined' };
    }
    return { success: false, message: 'Registration is not allowed at this time.', status: 'not_allowed' };
};

const cancelLesson = async (userId, lessonId) => {
    console.log(`Manager: User ${userId} attempting to cancel lesson ${lessonId}`);

    const removedRegistered = await deleteLessonRegistration(userId, lessonId);

    if (removedRegistered) {
        console.log(`Manager: User ${userId} cancelled registration for lesson ${lessonId}`);
        await updateLessonCurrentParticipants(lessonId, -1);

        const waitlist = await findFirstInWaitlist(lessonId);

        if (waitlist.length > 0) {
            const firstInLine = waitlist[0];
            await deleteWaitingListItem(firstInLine.user_id, lessonId);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
            await createReservedSpot(firstInLine.user_id, lessonId, expiresAt);

            const user_model = await findUserById(firstInLine.user_id);
            const lessonObj = await findLessonById(lessonId); 
            
            const lessonData = lessonObj ? lessonObj.toJSON() : null;

            const subject = 'Spot Available in Lesson';
            const text = `Hello ${user_model.first_name || ''},\n\nA spot has opened up in the lesson "${lessonData ? lessonData.lesson_type : 'Unknown'}". We have reserved a spot for you until ${expiresAt.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false})}.\nPlease log in to the application to complete your registration.\n\nGood luck!`;
            
            console.log(`Sending email to: ${user_model.email}`);
            await sendEmail(user_model.email, subject, text);
            console.log(`Manager: Reservation created and email sent to user ${firstInLine.user_id}`);
        }
        return { status: 'cancelled_from_registered' };
    }

    const removedWaitlist = await deleteWaitingListItem(userId, lessonId);
    if (removedWaitlist) {
        console.log(`Manager: User ${userId} cancelled from waitlist for lesson ${lessonId}`);
        return { status: 'cancelled_from_waitlist' };
    }
    console.log(`Manager: User ${userId} not found in registrations or waitlist for lesson ${lessonId}`);
    return { status: 'not_found' };
};

// New: Add, Update, Delete lesson functions for secretary
const addLesson = async (lessonData) => {
    console.log('Manager: Adding new lesson with data:', lessonData);
    const lessonToCreate = {
        lesson_type: lessonData.lesson_type,
        scheduled_at: lessonData.scheduled_at, 
        room_number: lessonData.room_number,
        max_participants: lessonData.max_participants,
        instructor_id: lessonData.instructor_id, 
        day: getDayOfWeekName(lessonData.scheduled_at), // Calculate day from UTC scheduled_at
        current_participants: 0 
    };
    console.log('Manager: Final lesson data to create in DB:', lessonToCreate);
    const newLesson = await createLesson(lessonToCreate); 
    return newLesson.toJSON(); 
};

const updateLesson = async (lessonId, updatedData) => {
    console.log(`Manager: Updating lesson ${lessonId} with received data:`, updatedData);
    const dataToUpdate = { ...updatedData };
    if (dataToUpdate.scheduled_at) {
        dataToUpdate.day = getDayOfWeekName(dataToUpdate.scheduled_at);
        console.log(`Manager: Recalculated day for update: ${dataToUpdate.day}`);
    }
    
    console.log('Manager: Final data to update in DB:', dataToUpdate);
    const updatedLesson = await updateLessonData(lessonId, dataToUpdate);
    
    if (updatedLesson) {
        console.log('Manager: Lesson updated successfully, returning updated lesson object:', updatedLesson.toJSON());
        return updatedLesson.toJSON();
    } else {
        console.warn('Manager: Lesson update did not return an updated object. Lesson ID:', lessonId);
        return null;
    }
};

const deleteLesson = async (lessonId) => {
    console.log(`Manager: Deleting lesson ${lessonId}`);
    // You might want to add cascading deletes for registrations, waitlist, favorites here
    const deleted = await deleteLessonById(lessonId); 
    if (deleted) {
        console.log(`Manager: Lesson ${lessonId} deleted successfully.`);
    } else {
        console.warn(`Manager: Lesson ${lessonId} was not found or not deleted.`);
    }
    return deleted; 
};

// --- New Favorite BL Functions ---
const addFavoriteLesson = async (userId, lessonId) => {
    console.log(`Manager: Adding lesson ${lessonId} to favorites for user ${userId}`);
    // Check if lesson exists
    const lessonExists = await findLessonById(lessonId);
    if (!lessonExists) {
        throw new Error('Lesson not found.');
    }
    // Check if user exists (though auth middleware should handle this)
    const userExists = await findUserById(userId);
    if (!userExists) {
        throw new Error('User not found.');
    }

    const result = await createFavorite(userId, lessonId);
    if (result && result.message === 'Favorite already exists') {
        return { success: false, message: 'Lesson is already a favorite.' };
    }
    return { success: true, message: 'Lesson added to favorites.' };
};

const removeFavoriteLesson = async (userId, lessonId) => {
    console.log(`Manager: Removing lesson ${lessonId} from favorites for user ${userId}`);
    const deleted = await deleteFavorite(userId, lessonId);
    if (!deleted) {
        throw new Error('Favorite not found.');
    }
    return { success: true, message: 'Lesson removed from favorites.' };
};

const getFavoriteLessonsForUser = async (userId, weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid weekly start date for favorites.");
    }
    console.log(`Manager: Fetching favorite lessons for user ${userId} for week starting ${weekStart}`);
    const favoriteLessons = await findUserFavoriteLessons(userId, start, end);
    // The DAL function already adds isFavorite = true and converts to JSON
    return favoriteLessons; 
};


// Export all functions at the end of the file
module.exports = {
    getLessonsForWeek,
    getUserRegisteredAndWaitlistedLessons,
    getUserLessons,
    getUserWaitlistedLessons,
    getRegisteredCounts,
    joinLesson,
    cancelLesson,
    addLesson,
    updateLesson,
    deleteLesson,
    addFavoriteLesson,
    removeFavoriteLesson,
    getFavoriteLessonsForUser
};
