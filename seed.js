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

  await Lesson.bulkCreate([
    { lesson_type: 'Yoga', hours: 2, day: 'Monday', instructor_id: 'u1', room_number: 'Room 1', max_participants: 15, start_date: new Date('2025-06-01'), end_date: new Date('2025-07-01') },
    { lesson_type: 'Pilates', hours: 1, day: 'Wednesday', instructor_id: 'u1', room_number: 'Room 2', max_participants: 10, start_date: new Date('2025-06-03'), end_date: new Date('2025-07-03') },
  ]);

  await Favorite.bulkCreate([
    { user_id: 'u2', lesson_id: 1 },
    { user_id: 'u3', lesson_id: 2 },
  ]);

  await Cancellation.bulkCreate([
    { instructor_id: 'u1', lesson_id: 1, notes: 'Instructor unavailable on Monday' }
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
