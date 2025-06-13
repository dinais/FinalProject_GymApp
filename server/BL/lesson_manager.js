const dal = require('../DAL/dal');
const { lesson, lesson_registrations } = require('../../DB/models');
const { Op } = require('sequelize');

exports.getLessonsForWeek = async (weekStart) => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return dal.findAll(lesson, {
    where: {
      date: {
        [Op.between]: [start, end]
      }
    }
  });
};

exports.getUserLessons = async (userId, weekStart) => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return dal.findAll(lesson, {
    include: [{
      model: lesson_registrations,
      where: {
        userId,
        is_waitlist: false
      }
    }],
    where: {
      date: {
        [Op.between]: [start, end]
      }
    }
  });
};

exports.getUserWaitlistedLessons = async (userId, weekStart) => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return dal.findAll(lesson, {
    include: [{
      model: lesson_registrations,
      where: {
        userId,
        is_waitlist: true
      }
    }],
    where: {
      date: {
        [Op.between]: [start, end]
      }
    }
  });
};

exports.getRegisteredCounts = async (weekStart) => {
  const lessons = await exports.getLessonsForWeek(weekStart);
  const counts = {};

  for (const lesson of lessons) {
    const participants = await dal.findAll(lesson_registrations, {
      where: {
        lessonId: lesson.id,
        is_waitlist: false
      }
    });
    counts[lesson.id] = participants.length;
  }

  return counts;
};

exports.joinLesson = async (userId, lessonId) => {
  const user_lesson = await dal.findById(lesson, lessonId);
  if (!lesson) return { status: 'not_found' };

  const registered = await dal.findAll(lesson_registrations, {
    where: {
      lessonId,
      is_waitlist: false
    }
  });

  const waitlisted = await dal.findAll(lesson_registrations, {
    where: {
      lessonId,
      is_waitlist: true
    }
  });

  const alreadyRegistered = registered.find(p => p.userId === userId);
  const alreadyWaitlisted = waitlisted.find(p => p.userId === userId);

  if (alreadyRegistered) return { status: 'already_joined' };
  if (alreadyWaitlisted) return { status: 'already_waitlist' };

  if (registered.length < user_lesson.max_participants) {
    await dal.create(LessonParticipant, { lessonId, userId, is_waitlist: false });
    return { status: 'joined' };
  } else {
    await dal.create(LessonParticipant, { lessonId, userId, is_waitlist: true });
    return { status: 'waitlist' };
  }
};

exports.cancelLesson = async (userId, lessonId) => {
  const removed = await dal.remove(lesson_registrations, {
    lessonId,
    userId,
    is_waitlist: false
  });

  if (removed) {
    // Check waitlist
    const waitlist = await dal.findAll(lesson_registrations, {
      where: {
        lessonId,
        is_waitlist: true
      },
      order: [['createdAt', 'ASC']],
      limit: 1
    });

    if (waitlist.length > 0) {
      const firstInLine = waitlist[0];
      await dal.update(LessonParticipant, firstInLine.id, { is_waitlist: false });
    }

    return { status: 'cancelled_from_registered' };
  }

  const removedFromWaitlist = await dal.remove(lesson_registrations, {
    lessonId,
    userId,
    is_waitlist: true
  });

  if (removedFromWaitlist) {
    return { status: 'cancelled_from_waitlist' };
  }

  return { status: 'not_found' };
};
