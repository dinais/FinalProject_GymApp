// BL/lesson_manager.js
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
  deleteExpiredReservedSpotsForLesson,
  createFavorite,
  deleteFavorite,
  findUserFavoriteLessons 
} = require('../DAL/lesson_dal');


const getDayOfWeekName = (dateString) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; 
  const date = new Date(dateString); 

  if (isNaN(date.getTime())) {
    console.error('getDayOfWeekName: Invalid date string provided:', dateString);
    return 'Invalid Day'; 
  }

  return days[date.getUTCDay()];
};

const getLessonsForWeek = async (weekStart, userId = null) => { 
  const start = new Date(weekStart); 
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
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
  return (await findUserRegisteredLessons(userId, start, end)).map(l => l.toJSON());
};

const getUserWaitlistedLessons = async (userId, weekStart) => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return (await findUserWaitlistedLessons(userId, start, end)).map(l => l.toJSON());
};

const getRegisteredCounts = async (weekStart) => {
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
  const theLesson = await findLessonById(lessonId);
  if (!theLesson) {
    return { success: false, message: 'Lesson not found.' };
  }
  await deleteExpiredReservedSpotsForLesson(lessonId);
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
  const removedRegistered = await deleteLessonRegistration(userId, lessonId);

  if (removedRegistered) {
    console.log(`Manager: User ${userId} cancelled registration for lesson ${lessonId}`);
    await updateLessonCurrentParticipants(lessonId, -1);

    const waitlist = await findFirstInWaitlist(lessonId);
    if (waitlist.length > 0) {
      const firstInLine = waitlist[0];
      await deleteWaitingListItem(firstInLine.user_id, lessonId);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 
      await createReservedSpot(firstInLine.user_id, lessonId, expiresAt);

      const user_model = await findUserById(firstInLine.user_id);
      const lessonObj = await findLessonById(lessonId);

      const lessonData = lessonObj ? lessonObj.toJSON() : null;

      const subject = 'Spot Available in Lesson';
      const text = `Hello ${user_model.first_name || ''},\n\nA spot has opened up in the lesson "${lessonData ? lessonData.lesson_type : 'Unknown'}". We have reserved a spot for you until ${expiresAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}.\nPlease log in to the application to complete your registration.\n\nGood luck!`;

      console.log(`Sending email to: ${user_model.email}`);
      await sendEmail(user_model.email, subject, text);
      console.log(`Manager: Reservation created and email sent to user ${firstInLine.user_id}`);
    }
    return { status: 'cancelled_from_registered' };
  }

  const removedWaitlist = await deleteWaitingListItem(userId, lessonId);
  if (removedWaitlist) {
    return { status: 'cancelled_from_waitlist' };
  }
  return { status: 'not_found' };
};

const addLesson = async (lessonData) => {
  const lessonToCreate = {
    lesson_type: lessonData.lesson_type,
    scheduled_at: lessonData.scheduled_at,
    room_number: lessonData.room_number,
    max_participants: lessonData.max_participants,
    instructor_id: lessonData.instructor_id,
    day: getDayOfWeekName(lessonData.scheduled_at), 
    current_participants: 0
  };
  const newLesson = await createLesson(lessonToCreate);
  return newLesson.toJSON();
};

const updateLesson = async (lessonId, updatedData) => {
  const dataToUpdate = { ...updatedData };
  if (dataToUpdate.scheduled_at) {
    dataToUpdate.day = getDayOfWeekName(dataToUpdate.scheduled_at);
  }

  const updatedLesson = await updateLessonData(lessonId, dataToUpdate);

  if (updatedLesson) {
    return updatedLesson.toJSON();
  } else {
    console.warn('Manager: Lesson update did not return an updated object. Lesson ID:', lessonId);
    return null;
  }
};

const deleteLesson = async (lessonId) => {
  const deleted = await deleteLessonById(lessonId);
  if (deleted) {
  } else {
    console.warn(`Manager: Lesson ${lessonId} was not found or not deleted.`);
  }
  return deleted;
};

const addFavoriteLesson = async (userId, lessonId) => {
  const lessonExists = await findLessonById(lessonId);
  if (!lessonExists) {
    throw new Error('Lesson not found.');
  }
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

  console.log(`Manager: Received weekStart param: ${weekStart}`);
  console.log(`Manager: Parsed start date: ${start}`);
  console.log(`Manager: Calculated end date: ${end}`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid weekly start date for favorites.");
  }

  const favoriteLessons = await findUserFavoriteLessons(userId, start, end);
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
