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
    system_message
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

        // 4. צור שיעורים
        const startDates = [
            new Date('2025-06-01'), // שבוע 1
            new Date('2025-06-08'), // שבוע 2
            new Date('2025-06-15')  // שבוע 3 - יום ראשון הקרוב הוא ה-15 ביוני 2025
        ];

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const lessonTypes = ['Yoga', 'Pilates', 'Zumba', 'Spinning'];
        const rooms = ['Room A', 'Room B', 'Room C', 'Room D'];

        let lessonsToCreate = [];

        for (let week = 0; week < 3; week++) {
            const weekStart = new Date(startDates[week]);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // סוף השבוע, 6 ימים מההתחלה

            for (let i = 0; i < days.length; i++) {
                for (let j = 0; j < lessonTypes.length; j++) {
                    const instructor = j % 2 === 0 ? coach1 : coach2;
                    
                    // תאריך וזמן ספציפיים יותר לשיעורים
                    const lessonDate = new Date(weekStart);
                    lessonDate.setDate(weekStart.getDate() + i); // התאריך הספציפי ליום בשבוע
                    lessonDate.setHours(10 + j, 0, 0, 0); // שעות שונות לכל סוג שיעור

                    lessonsToCreate.push({
                        lesson_type: lessonTypes[j],
                        hours: j % 2 === 0 ? 1 : 2,
                        day: days[i],
                        instructor_id: instructor.id,
                        room_number: rooms[j],
                        max_participants: 10 + j * 2,
                        current_participants: 0,
                        start_date: lessonDate, // שימוש בתאריך הספציפי
                        end_date: new Date(lessonDate.getTime() + (j % 2 === 0 ? 1 : 2) * 60 * 60 * 1000), // סוף השיעור
                    });
                }
            }
        }

        const createdLessons = await lesson.bulkCreate(lessonsToCreate, { returning: true });

        console.log('✅ Lessons created successfully.');

        // 🔥 הוספת שיעור מלא (ידני) - נבחר שיעור בשבוע הנוכחי
        const fullLessonDate = new Date('2025-06-17'); // היום!
        fullLessonDate.setHours(18, 0, 0, 0); // בשעה 18:00
        const fullLesson = await lesson.create({
            lesson_type: 'Spinning',
            hours: 1,
            day: 'Tuesday', // היום
            instructor_id: coach1.id,
            room_number: 'Room X',
            max_participants: 3,
            current_participants: 3, // נגדיר אותו מלא כבר בהתחלה
            start_date: fullLessonDate,
            end_date: new Date(fullLessonDate.getTime() + 60 * 60 * 1000),
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
        await system_message.bulkCreate([
            { user_id: client1.id, role: 'client', message: 'Welcome to the gym!' },
            { user_id: coach1.id, role: 'coach', message: 'Lesson successfully scheduled' },
            { user_id: secretary.id, role: 'secretary', message: 'Daily report ready' }
        ]);
        console.log('✅ System messages created successfully.');

        console.log('✨ Seed data insertion complete! Database is ready. ✨');

    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1); // יציאה עם קוד שגיאה
    }
}

seed();