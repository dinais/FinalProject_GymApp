const { User, Role, Lesson, Favorite, Cancellation, MyLesson, WaitingList, Password, SystemMessage } = require('./DB/models');

async function seed() {
  
  await User.bulkCreate([
    { id: 'u1', first_name: 'David', last_name: 'Cohen', address: 'Tel Aviv', phone: '0501234567', gmail: 'david@example.com' },
    { id: 'u2', first_name: 'Sarah', last_name: 'Levi', address: 'Jerusalem', phone: '0529876543', gmail: 'sarah@example.com' },
    { id: 'u3', first_name: 'Maya', last_name: 'Goldberg', address: 'Haifa', phone: '0541237890', gmail: 'maya@example.com' },
  ]);

  await Role.bulkCreate([
    { client_id: 'u1', role: 'instructor' },
    { client_id: 'u2', role: 'client' },
    { client_id: 'u3', role: 'client' },
  ]);

  const startDates = [
    new Date('2025-06-01'), // שבוע ראשון
    new Date('2025-06-08'), // שבוע שני
    new Date('2025-06-15')  // שבוע שלישי
  ];

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const lessonTypes = ['Yoga', 'Pilates', 'Zumba'];
  const rooms = ['Room 1', 'Room 2', 'Room 3'];

  let lessons = [];

  for (let week = 0; week < 3; week++) {
    const weekStart = new Date(startDates[week]);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    for (let i = 0; i < days.length; i++) {
      for (let j = 0; j < lessonTypes.length; j++) {
        lessons.push({
          lesson_type: lessonTypes[j],
          hours: j % 2 === 0 ? 1 : 2,
          day: days[i],
          instructor_id: 'u1',
          room_number: rooms[j],
          max_participants: 10 + j * 2,
          start_date: new Date(weekStart),
          end_date: new Date(weekEnd),
        });
      }
    }
  }

  await Lesson.bulkCreate(lessons);

  await Favorite.bulkCreate([
    { user_id: 'u2', lesson_id: 1 },
    { user_id: 'u3', lesson_id: 2 },
  ]);

  await Cancellation.bulkCreate([
    { instructor_id: 'u1', lesson_id: 1, notes: 'Instructor unavailable on Sunday' }
  ]);

  await MyLesson.bulkCreate([
    { user_id: 'u2', lesson_id: 1, registration_date: new Date('2025-05-30') },
    { user_id: 'u3', lesson_id: 2, registration_date: new Date('2025-06-01') },
  ]);

  await WaitingList.bulkCreate([
    { client_id: 'u3', lesson_id: 1, date: new Date('2025-05-29') }
  ]);

  await Password.bulkCreate([
    { user_id: 'u1', hash: 'hashed_password_1' },
    { user_id: 'u2', hash: 'hashed_password_2' },
    { user_id: 'u3', hash: 'hashed_password_3' },
  ]);

  await SystemMessage.bulkCreate([
    { client_id: 'u2', role: 'client', message: 'Welcome to the system!' },
    { client_id: 'u1', role: 'instructor', message: 'New lesson scheduled' },
  ]);

  console.log('Seed data inserted successfully');
}

seed().catch(err => console.error('Seed failed:', err));
