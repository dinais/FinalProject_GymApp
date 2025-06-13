const bcrypt = require('bcrypt');
const { user, role, user_role, lesson, favorite, cancellation, lesson_registrations, waiting_list, password, system_message } = require('./DB/models');

async function seed() {
  try {
    // 1. צור משתמשים
    const users = await user.bulkCreate([
      { first_name: "David", last_name: "Cohen", address: "Tel Aviv", phone: "0501234567", id_number: "123456789", email: "david.cohen@example.com" }, // מאמן
      { first_name: "Sarah", last_name: "Levi", address: "Jerusalem", phone: "0529876543", id_number: "234567890", email: "sarah.levi@example.com" }, // לקוחה
      { first_name: "Maya", last_name: "Goldberg", address: "Haifa", phone: "0541237890", id_number: "345678901", email: "maya.goldberg@example.com" }, // לקוחה
      { first_name: "Noa", last_name: "Bar", address: "Ramat Gan", phone: "0509876543", id_number: "456789012", email: "noa.bar@example.com" }, // מזכירה
      { first_name: "Tomer", last_name: "Katz", address: "Beer Sheva", phone: "0531112222", id_number: "567890123", email: "tomer.katz@example.com" }, // מאמן
      { first_name: "Dana", last_name: "Aviv", address: "Netanya", phone: "0523334444", id_number: "678901234", email: "dana.aviv@example.com" } // לקוחה
    ], { returning: true });

    const [coach1, client1, client2, secretary, coach2, client3] = users;

    // 2. צור תפקידים (רק התפקידים עצמם)
    const roles = await role.bulkCreate([
      { role: 'coach' },
      { role: 'client' },
      { role: 'secretary' }
    ], { returning: true });

    // 3. קשר בין משתמש לתפקיד בטבלת user_role (Many-to-Many)
    await user_role.bulkCreate([
      { user_id: coach1.id, role_id: roles.find(r => r.role === 'coach').id },
      { user_id: coach2.id, role_id: roles.find(r => r.role === 'coach').id },
      { user_id: client1.id, role_id: roles.find(r => r.role === 'client').id },
      { user_id: client2.id, role_id: roles.find(r => r.role === 'client').id },
      { user_id: client3.id, role_id: roles.find(r => r.role === 'client').id },
      { user_id: secretary.id, role_id: roles.find(r => r.role === 'secretary').id }
    ]);

    // 4. צור שיעורים
    const startDates = [
      new Date('2025-06-01'),
      new Date('2025-06-08'),
      new Date('2025-06-15')
    ];

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const lessonTypes = ['Yoga', 'Pilates', 'Zumba', 'Spinning'];
    const rooms = ['Room A', 'Room B', 'Room C', 'Room D'];

    let lessons = [];

    for (let week = 0; week < 3; week++) {
      const weekStart = new Date(startDates[week]);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      for (let i = 0; i < days.length; i++) {
        for (let j = 0; j < lessonTypes.length; j++) {
          const instructor = j % 2 === 0 ? coach1 : coach2;

          lessons.push({
            lesson_type: lessonTypes[j],
            hours: j % 2 === 0 ? 1 : 2,
            day: days[i],
            instructor_id: instructor.id,  // כאן השתמשנו ב-id
            room_number: rooms[j],
            max_participants: 10 + j * 2,
            start_date: new Date(weekStart),
            end_date: new Date(weekEnd),
          });
        }
      }
    }

    await lesson.bulkCreate(lessons);

    // 5. צור מועדפים
    await favorite.bulkCreate([
      { user_id: client1.id, lesson_id: 1 },
      { user_id: client2.id, lesson_id: 2 },
      { user_id: client3.id, lesson_id: 3 }
    ]);

    // 6. ביטולים
    await cancellation.bulkCreate([
      { instructor_id: coach1.id, lesson_id: 1, notes: 'Sick' }
    ]);

    // 7. הרשמות לשיעורים
    await lesson_registrations.bulkCreate([
      { user_id: client1.id, lesson_id: 1, registration_date: new Date('2025-05-30') },
      { user_id: client2.id, lesson_id: 2, registration_date: new Date('2025-06-01') },
      { user_id: client3.id, lesson_id: 3, registration_date: new Date('2025-06-02') },
    ]);

    // 8. רשימת המתנה
    await waiting_list.bulkCreate([
      { user_id: client3.id, lesson_id: 1, date: new Date('2025-05-29') }
    ]);

    // 9. סיסמאות עם bcrypt
    const passwords = [
      { user_id: coach1.id, plain: 'coachpass1' },
      { user_id: coach2.id, plain: 'coachpass2' },
      { user_id: client1.id, plain: 'clientpass1' },
      { user_id: client2.id, plain: 'clientpass2' },
      { user_id: client3.id, plain: 'clientpass3' },
      { user_id: secretary.id, plain: 'secret123' }
    ];
    console.log(passwords);
    

    for (const pw of passwords) {
      const hash = await bcrypt.hash(pw.plain, 10);
      if (!pw.user_id) throw new Error('user_id is null or undefined for password seed');
      await password.create({ user_id: pw.user_id, hash });
    }
    console.log('system_message:', system_message);

    // 10. הודעות מערכת
    await system_message.bulkCreate([
      { user_id: client1.id, role: 'client', message: 'Welcome to the gym!' },
      { user_id: coach1.id, role: 'coach', message: 'Lesson successfully scheduled' },
      { user_id: secretary.id, role: 'secretary', message: 'Daily report ready' }
    ]);

    console.log('Seed data inserted successfully');
  } catch (err) {
    console.error('Seed failed:', err);
  }
}

seed();
