const bcrypt = require('bcrypt');
const {
    user,
    role,
    user_role,
    lesson,
    favorite,
    cancellation,
    lesson_registrations,
    waiting_list,
    password,
    message
} = require('./DB/models'); // ודאי שהנתיב ל-DB/models נכון

async function seed() {
    try {
        console.log('🔄 Starting database seed...');

        // 1. צור משתמשים עם כתובות מפורטות
        const users = await user.bulkCreate([
            {
                first_name: "David", last_name: "Cohen",
                street_name: "הרצל", house_number: "10", apartment_number: "א", city: "תל אביב", zip_code: "6000001", country: "ישראל",
                phone: "0501234567", id_number: "123456789", email: "dinablack092@gmail.com"
            }, // מאמן
            {
                first_name: "Sarah", last_name: "Levi",
                street_name: "בן יהודה", house_number: "25", apartment_number: "3", city: "ירושלים", zip_code: "9000002", country: "ישראל",
                phone: "0529876543", id_number: "234567890", email: "sarah.levi@example.com"
            }, // לקוחה
            {
                first_name: "Maya", last_name: "Goldberg",
                street_name: "הכרמל", house_number: "7", apartment_number: "ק1", city: "חיפה", zip_code: "3000003", country: "ישראל",
                phone: "0541237890", id_number: "345678901", email: "maya.goldberg@example.com"
            }, // לקוחה
            {
                first_name: "Noa", last_name: "Bar",
                street_name: "ביאליק", house_number: "30", city: "רמת גן", zip_code: "5200004", country: "ישראל",
                phone: "0509876543", id_number: "456789012", email: "noa.bar@example.com"
            }, // מזכירה
            {
                first_name: "Tomer", last_name: "Katz",
                street_name: "שדרות רגר", house_number: "1", city: "באר שבע", zip_code: "8400005", country: "ישראל",
                phone: "0531112222", id_number: "567890123", email: "tomer.katz@example.com"
            }, // מאמן
            {
                first_name: "Dana", last_name: "Aviv",
                street_name: "השרון", house_number: "50", apartment_number: "12", city: "נתניה", zip_code: "4200006", country: "ישראל",
                phone: "0523334444", id_number: "678901234", email: "dana.aviv@example.com"
            } // לקוחה
        ], { returning: true });

        const [coach1, client1, client2, secretary, coach2, client3] = users;

        console.log('✅ Users created successfully.');

        // 2. צור תפקידים
        const roles = await role.bulkCreate([
            { role: 'coach' },
            { role: 'client' },
            { role: 'secretary' }
        ], { returning: true });

        console.log('✅ Roles created successfully.');

        // 3. קשר בין משתמשים לתפקידים
        await user_role.bulkCreate([
            { user_id: coach1.id, role_id: roles.find(r => r.role === 'coach').id },
            { user_id: coach1.id, role_id: roles.find(r => r.role === 'client').id },
            { user_id: coach2.id, role_id: roles.find(r => r.role === 'coach').id },
            { user_id: client1.id, role_id: roles.find(r => r.role === 'client').id },
            { user_id: client2.id, role_id: roles.find(r => r.role === 'client').id },
            { user_id: client3.id, role_id: roles.find(r => r.role === 'client').id },
            { user_id: secretary.id, role_id: roles.find(r => r.role === 'secretary').id }
        ]);

        console.log('✅ User roles created successfully.');
                // ההגדרה של השיעורים לפי יום ושעה
        const weeklySchedule = {
            Sunday: [
                { time: "08:00", lesson_type: "Pilates" },
                { time: "09:00", lesson_type: "Dynamic Design" },
                { time: "19:00", lesson_type: "Dynamic Design" },
                { time: "20:00", lesson_type: "Moderate Pilates" },
                { time: "21:00", lesson_type: "Pilates" }
            ],
            Monday: [
                { time: "17:00", lesson_type: "Yoga" },
                { time: "18:30", lesson_type: "Senior Design" },
                { time: "19:30", lesson_type: "Core Strength" },
                { time: "20:30", lesson_type: "Aerobic & Dynamic Design" },
                { time: "21:30", lesson_type: "Zumba" }
            ],
            Tuesday: [
                { time: "08:00", lesson_type: "Pilates" },
                { time: "09:00", lesson_type: "Moderate Pilates" },
                { time: "10:00", lesson_type: "Aerobic & Design" },
                { time: "11:00", lesson_type: "Dynamic Design" },
                { time: "11:55", lesson_type: "Abdominal Rehab" },
                { time: "20:15", lesson_type: "Strength & Fat Burn" }
            ],
            Wednesday: [
                { time: "17:30", lesson_type: "Pilates" },
                { time: "18:30", lesson_type: "Kickboxing / HIT" },
                { time: "19:30", lesson_type: "Design & Sculpt" },
                { time: "20:30", lesson_type: "Aerobic & Design" },
                { time: "21:30", lesson_type: "Zumba" }
            ],
            Thursday: [
                { time: "08:00", lesson_type: "Pilates" },
                { time: "09:00", lesson_type: "Feldenkrais" },
                { time: "10:10", lesson_type: "Feldenkrais" },
                { time: "11:20", lesson_type: "Pilates Rehab" },
                { time: "12:15", lesson_type: "Pilates & Stretch" },
                { time: "20:30", lesson_type: "Kung Fu" }
            ],
            Friday: [
                { time: "08:00", lesson_type: "Design & Pilates" },
                { time: "09:00", lesson_type: "Design & Sculpt" },
                { time: "10:00", lesson_type: "Design HIT" }
            ],
            Saturday: [
                { time: "22:00", lesson_type: "Weight Training" }
            ]
        };

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const createdLessons = await createLessonsForRange([coach1, coach2, client3]);

        // 4. צור שיעורים


        // הפונקציה שמייצרת את כל השיעורים לפי הטווח והלוח
      async function createLessonsForRange(instructorsList) {
    const lessonsToCreate = [];

    function getSunday(date) {
        const day = date.getDay();
        const diff = (day === 0) ? 0 : -day;
        const sunday = new Date(date);
        sunday.setHours(0, 0, 0, 0);
        sunday.setDate(date.getDate() + diff);
        return sunday;
    }

    const today = new Date();
    const baseSunday = getSunday(today);

    for (let weekOffset = -3; weekOffset <= 3; weekOffset++) {
        const currentSunday = new Date(baseSunday);
        currentSunday.setDate(baseSunday.getDate() + weekOffset * 7);

        for (const dayName of daysOfWeek) {
            const dayIndex = daysOfWeek.indexOf(dayName);
            const lessons = weeklySchedule[dayName];
            if (!lessons) continue;

            for (let i = 0; i < lessons.length; i++) {
                const lesson = lessons[i];
                const lessonDate = new Date(currentSunday);
                lessonDate.setDate(currentSunday.getDate() + dayIndex);
                const [hour, minute] = lesson.time.split(':').map(Number);
                lessonDate.setHours(hour, minute, 0, 0);

                const instructor = instructorsList[(i + dayIndex + weekOffset + instructorsList.length) % instructorsList.length];

                lessonsToCreate.push({
                    lesson_type: lesson.lesson_type,
                    day: dayName,
                    instructor_id: instructor.id,
                    room_number: `Room ${String.fromCharCode(65 + (i % 26))}`,
                    max_participants: 15,
                    current_participants: 0,
                    scheduled_at: lessonDate
                });
            }
        }
    }

    const created = await lesson.bulkCreate(lessonsToCreate, { returning: true });
    console.log(`✅ Created ${created.length} lessons for 7 weeks range`);
    return created;
}



        // 🔥 הוספת שיעור מלא (ידני) - נבחר שיעור בשבוע הנוכחי
        const fullLessonDate = new Date('2025-06-17'); // היום!
        fullLessonDate.setHours(18, 0, 0, 0); // בשעה 18:00
        const fullLesson = await lesson.create({
            lesson_type: 'Spinning',
            day: 'Tuesday', // היום
            instructor_id: coach1.id,
            room_number: 'Room X',
            max_participants: 3,
            current_participants: 3, // נגדיר אותו מלא כבר בהתחלה
            scheduled_at: fullLessonDate
        });
        console.log('✅ Full lesson created.');


        // 5. מועדפים
        await favorite.bulkCreate([
            { user_id: client1.id, lesson_id: createdLessons[0].id }, // שיעור היוגה הראשון
            { user_id: client2.id, lesson_id: createdLessons[1].id }, // שיעור הפילאטיס הראשון
            { user_id: client3.id, lesson_id: createdLessons[2].id }  // שיעור הזומבה הראשון
        ]);
        console.log('✅ Favorites created successfully.');

        // 6. ביטולים
        await cancellation.bulkCreate([
            { instructor_id: coach1.id, lesson_id: createdLessons[0].id, notes: 'Sick' }
        ]);
        console.log('✅ Cancellations created successfully.');

        // 7. הרשמות לשיעורים רגילים (כולל שיעורים מהעבר)
        await lesson_registrations.bulkCreate([
            // שיעורים מהשבוע הראשון (עבר)
            { user_id: client1.id, lesson_id: createdLessons[0].id, registration_date: new Date('2025-05-30') }, // יוגה ב-1 ליוני
            { user_id: client2.id, lesson_id: createdLessons[1].id, registration_date: new Date('2025-06-01') }, // פילאטיס ב-1 ליוני
            // שיעורים מהשבוע השני (עבר/הווה)
            { user_id: client3.id, lesson_id: createdLessons[10].id, registration_date: new Date('2025-06-05') }, // שיעור כלשהו בשבוע השני
            // שיעורים מהשבוע השלישי (עתיד)
            { user_id: client1.id, lesson_id: createdLessons[20].id, registration_date: new Date('2025-06-15') }, // שיעור כלשהו בשבוע השלישי
            { user_id: client2.id, lesson_id: createdLessons[21].id, registration_date: new Date('2025-06-16') }, // שיעור כלשהו בשבוע השלישי
        ]);

        // עדכון current_participants עבור השיעורים שנרשמו
        // נשתמש ב-Promise.all כדי לעדכן במקביל
        const registrationUpdates = [
            { id: createdLessons[0].id, by: 1 },
            { id: createdLessons[1].id, by: 1 },
            { id: createdLessons[10].id, by: 1 },
            { id: createdLessons[20].id, by: 1 },
            { id: createdLessons[21].id, by: 1 }
        ];

        await Promise.all(registrationUpdates.map(update =>
            lesson.increment('current_participants', { by: update.by, where: { id: update.id } })
        ));

        console.log('✅ Lesson registrations created and participant counts updated.');

        // ✅ הרשמות לשיעור המלא (כבר מלא)
        await lesson_registrations.bulkCreate([
            { user_id: coach1.id, lesson_id: fullLesson.id, registration_date: new Date('2025-06-10') },
            { user_id: coach2.id, lesson_id: fullLesson.id, registration_date: new Date('2025-06-11') },
            { user_id: client3.id, lesson_id: fullLesson.id, registration_date: new Date('2025-06-12') }, // לקוחה3 נרשמת לשיעור המלא
        ]);
        console.log('✅ Registrations for full lesson added.');

        // ✅ רשימת המתנה עבור השיעור המלא
        await waiting_list.bulkCreate([
            { user_id: client1.id, lesson_id: fullLesson.id, date: new Date('2025-06-13T10:00:00Z') }, // לקוחה1 בהמתנה
            { user_id: client2.id, lesson_id: fullLesson.id, date: new Date('2025-06-13T10:05:00Z') }, // לקוחה2 בהמתנה
            { user_id: secretary.id, lesson_id: fullLesson.id, date: new Date('2025-06-13T10:10:00Z') }, // מזכירה בהמתנה
        ]);
        console.log('✅ Waitlist for full lesson created.');


        // 9. סיסמאות
        const passwords = [
            { user_id: coach1.id, plain: 'coachpass1' },
            { user_id: coach2.id, plain: 'coachpass2' },
            { user_id: client1.id, plain: 'clientpass1' },
            { user_id: client2.id, plain: 'clientpass2' },
            { user_id: client3.id, plain: 'clientpass3' },
            { user_id: secretary.id, plain: 'secret123' }
        ];

        for (const pw of passwords) {
            const hash = await bcrypt.hash(pw.plain, 10);
            if (!pw.user_id) throw new Error(`user_id is null or undefined for password seed for user ${pw.plain}`);
            await password.create({ user_id: pw.user_id, hash });
        }
        console.log('✅ Passwords hashed and stored successfully.');

        // 10. הודעות מערכת
  const now = new Date();

await message.bulkCreate([
  {
    sender_id: coach1.id,
    recipient_id: client1.id,
    sender_role: 'coach',
    recipient_role: 'client',
    title: 'Lesson Reminder',
    message: 'Your lesson starts at 18:00. Don’t forget to bring a towel.',
    created_at: now
  },
  {
    sender_id: secretary.id,
    recipient_id: coach2.id,
    sender_role: 'secretary',
    recipient_role: 'coach',
    title: 'Schedule Update',
    message: 'Your Friday lesson has been moved to 10:00.',
    created_at: now
  },
  {
    sender_id: secretary.id,
    recipient_id: coach1.id,
    sender_role: 'secretary',
    recipient_role: 'coach',
    title: 'Schedule Update',
    message: 'Your Friday lesson has been moved to 10:00.',
    created_at: now
  }
]);

console.log('✅ Messages with titles inserted successfully.');


        console.log('✨ Seed data insertion complete! Database is ready. ✨');

    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1); // יציאה עם קוד שגיאה
    }
}

seed();