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
} = require('./DB/models'); // Ensure path to DB/models is correct

async function seed() {
    try {
        console.log('🔄 Starting database seed...');

        // 1. Create users with detailed addresses
        const users = await user.bulkCreate([
            {
                first_name: "David", last_name: "Cohen",
                street_name: "הרצל", house_number: "10", apartment_number: "א", city: "תל אביב", zip_code: "6000001", country: "ישראל",
                phone: "0501234567", id_number: "123456789", email: "dinablack092@gmail.com"
            }, // Coach 1
            {
                first_name: "Sarah", last_name: "Levi",
                street_name: "בן יהודה", house_number: "25", apartment_number: "3", city: "ירושלים", zip_code: "9000002", country: "ישראל",
                phone: "0529876543", id_number: "234567890", email: "sarah.levi@example.com"
            }, // Client 1
            {
                first_name: "Maya", last_name: "Goldberg",
                street_name: "הכרמל", house_number: "7", apartment_number: "ק1", city: "חיפה", zip_code: "3000003", country: "ישראל",
                phone: "0541237890", id_number: "345678901", email: "maya.goldberg@example.com"
            }, // Client 2
            {
                first_name: "Noa", last_name: "Bar",
                street_name: "ביאליק", house_number: "30", city: "רמת גן", zip_code: "5200004", country: "ישראל",
                phone: "0509876543", id_number: "456789012", email: "noa.bar@example.com"
            }, // Secretary
            {
                first_name: "Tomer", last_name: "Katz",
                street_name: "שדרות רגר", house_number: "1", city: "באר שבע", zip_code: "8400005", country: "ישראל",
                phone: "0531112222", id_number: "567890123", email: "tomer.katz@example.com"
            }, // Coach 2
            {
                first_name: "Dana", last_name: "Aviv",
                street_name: "השרון", house_number: "50", apartment_number: "12", city: "נתניה", zip_code: "4200006", country: "ישראל",
                phone: "0523334444", id_number: "678901234", email: "dana.aviv@example.com"
            }, // Client 3
            // NEW COACHES ADDED BELOW
            {
                first_name: "Or", last_name: "Levi",
                street_name: "הצנחנים", house_number: "5", apartment_number: "2", city: "תל אביב", zip_code: "6000007", country: "ישראל",
                phone: "0505556666", id_number: "789012345", email: "or.levi@example.com"
            }, // Coach 3
            {
                first_name: "Shir", last_name: "Cohen",
                street_name: "האמנים", house_number: "15", apartment_number: "א", city: "ירושלים", zip_code: "9000008", country: "ישראל",
                phone: "0527778888", id_number: "890123456", email: "shir.cohen@example.com"
            } // Coach 4
        ], { returning: true });

        const [coach1, client1, client2, secretary, coach2, client3, coach3, coach4] = users;

        console.log('✅ Users created successfully.');

        // 2. Create roles
        const roles = await role.bulkCreate([
            { role: 'coach' },
            { role: 'client' },
            { role: 'secretary' }
        ], { returning: true });

        console.log('✅ Roles created successfully.');

        // 3. Link users to roles
        await user_role.bulkCreate([
            { user_id: coach1.id, role_id: roles.find(r => r.role === 'coach').id },
            { user_id: coach1.id, role_id: roles.find(r => r.role === 'client').id }, // Coach 1 is also a client
            { user_id: coach2.id, role_id: roles.find(r => r.role === 'coach').id },
            { user_id: coach2.id, role_id: roles.find(r => r.role === 'client').id }, // Coach 2 is also a client
            { user_id: coach3.id, role_id: roles.find(r => r.role === 'coach').id }, // New coach 3
            { user_id: coach3.id, role_id: roles.find(r => r.role === 'client').id }, // New coach 3 is also a client
            { user_id: coach4.id, role_id: roles.find(r => r.role === 'coach').id }, // New coach 4
            { user_id: coach4.id, role_id: roles.find(r => r.role === 'client').id }, // New coach 4 is also a client
            { user_id: client1.id, role_id: roles.find(r => r.role === 'client').id },
            { user_id: client2.id, role_id: roles.find(r => r.role === 'client').id },
            { user_id: client3.id, role_id: roles.find(r => r.role === 'client').id },
            { user_id: secretary.id, role_id: roles.find(r => r.role === 'secretary').id }
        ]);

        console.log('✅ User roles created successfully.');
        
        // The lesson schedule by day and time
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

        // Define a list of actual coaches to assign to lessons
        const actualCoaches = [coach1, coach2, coach3, coach4]; // ONLY coaches here!
        const createdLessons = await createLessonsForRange(actualCoaches); // Pass only coaches

        // 4. Create lessons
        // The function that generates all lessons based on the range and schedule
        async function createLessonsForRange(instructorsList) {
            const lessonsToCreate = [];

            function getSunday(date) {
                const day = date.getDay(); // Local day of the week
                const diff = (day === 0) ? 0 : -day; // Difference to get to Sunday (0)
                const sunday = new Date(date);
                sunday.setHours(0, 0, 0, 0); // Set to local midnight
                sunday.setDate(date.getDate() + diff);
                return sunday;
            }

            const today = new Date();
            const baseSunday = getSunday(today);

            // Iterate for 7 weeks (-3 to +3 from current week)
            for (let weekOffset = -3; weekOffset <= 3; weekOffset++) {
                const currentSunday = new Date(baseSunday);
                currentSunday.setDate(baseSunday.getDate() + weekOffset * 7);

                for (const dayName of daysOfWeek) {
                    const dayIndex = daysOfWeek.indexOf(dayName);
                    const lessonsInDay = weeklySchedule[dayName];
                    if (!lessonsInDay) continue;

                    for (let i = 0; i < lessonsInDay.length; i++) {
                        const lessonEntry = lessonsInDay[i];
                        const lessonDate = new Date(currentSunday);
                        lessonDate.setDate(currentSunday.getDate() + dayIndex);
                        const [hour, minute] = lessonEntry.time.split(':').map(Number);
                        
                        // Set the time components in LOCAL timezone to match the intended schedule
                        lessonDate.setHours(hour, minute, 0, 0);

                        // CRITICAL: Convert the local scheduled_at to UTC for database storage
                        const scheduledAtUTC = lessonDate.toISOString();

                        // Assign instructor from the provided list, cycling through them
                        const instructor = instructorsList[(i + dayIndex + weekOffset + instructorsList.length) % instructorsList.length];

                        lessonsToCreate.push({
                            lesson_type: lessonEntry.lesson_type,
                            day: dayName, // This should be the English day name
                            instructor_id: instructor.id,
                            room_number: `Room ${String.fromCharCode(65 + (i % 26))}`,
                            max_participants: 15,
                            current_participants: 0,
                            scheduled_at: scheduledAtUTC // Store as UTC
                        });
                    }
                }
            }

            const created = await lesson.bulkCreate(lessonsToCreate, { returning: true });
            console.log(`✅ Created ${created.length} lessons for 7 weeks range`);
            return created;
        }

        // 🔥 Adding a manually full lesson (example) - choose a lesson in the current week
        // Note: this date should also be handled carefully for timezone.
        // If current date is June 24, 2025 (Tuesday), then this would be today 18:00
        const fullLessonLocalTime = new Date(); // Get current local date
        fullLessonLocalTime.setHours(18, 0, 0, 0); // Set to 18:00 local
        // Convert to UTC for storage
        const fullLessonScheduledAtUTC = fullLessonLocalTime.toISOString();
        const fullLessonDay = daysOfWeek[fullLessonLocalTime.getDay()];


        const fullLesson = await lesson.create({
            lesson_type: 'Spinning',
            day: fullLessonDay, // Use the actual day of the week for this specific date
            instructor_id: coach1.id,
            room_number: 'Room X',
            max_participants: 3,
            current_participants: 3, // Set as full initially
            scheduled_at: fullLessonScheduledAtUTC // Store as UTC
        });
        console.log('✅ Full lesson created.');


        // 5. Favorites
        await favorite.bulkCreate([
            { user_id: client1.id, lesson_id: createdLessons[0].id }, // First Yoga lesson
            { user_id: client2.id, lesson_id: createdLessons[1].id }, // First Pilates lesson
            { user_id: client3.id, lesson_id: createdLessons[2].id }  // First Zumba lesson
        ]);
        console.log('✅ Favorites created successfully.');

        // 6. Cancellations
        await cancellation.bulkCreate([
            { instructor_id: coach1.id, lesson_id: createdLessons[0].id, notes: 'Sick' }
        ]);
        console.log('✅ Cancellations created successfully.');

        // 7. Regular lesson registrations (including past lessons)
        // Adjusting example dates to align with "createdLessons" range and current date
        // Assuming createdLessons[0] is in the past-most week, and createdLessons[20] in the future
        await lesson_registrations.bulkCreate([
            { user_id: client1.id, lesson_id: createdLessons[0].id, registration_date: new Date() },
            { user_id: client2.id, lesson_id: createdLessons[1].id, registration_date: new Date() },
            { user_id: client3.id, lesson_id: createdLessons[10].id, registration_date: new Date() },
            { user_id: client1.id, lesson_id: createdLessons[20].id, registration_date: new Date() },
            { user_id: client2.id, lesson_id: createdLessons[21].id, registration_date: new Date() },
        ]);

        // Update current_participants for registered lessons
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

        // ✅ Registrations for the full lesson (already full)
        await lesson_registrations.bulkCreate([
            { user_id: coach1.id, lesson_id: fullLesson.id, registration_date: new Date() },
            { user_id: coach2.id, lesson_id: fullLesson.id, registration_date: new Date() },
            { user_id: client3.id, lesson_id: fullLesson.id, registration_date: new Date() }, // Client3 registered for full lesson
        ]);
        console.log('✅ Registrations for full lesson added.');

        // ✅ Waitlist for the full lesson
        await waiting_list.bulkCreate([
            { user_id: client1.id, lesson_id: fullLesson.id, date: new Date() }, // Client1 on waitlist
            { user_id: client2.id, lesson_id: fullLesson.id, date: new Date(Date.now() + 5 * 60 * 1000) }, // Client2 on waitlist (5 mins later)
            { user_id: secretary.id, lesson_id: fullLesson.id, date: new Date(Date.now() + 10 * 60 * 1000) }, // Secretary on waitlist (10 mins later)
        ]);
        console.log('✅ Waitlist for full lesson created.');

        // 9. Passwords
        const passwords = [
            { user_id: coach1.id, plain: 'coachpass1' },
            { user_id: coach2.id, plain: 'coachpass2' },
            { user_id: coach3.id, plain: 'coachpass3' }, // New coach password
            { user_id: coach4.id, plain: 'coachpass4' }, // New coach password
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

        // 10. System messages
        await system_message.bulkCreate([
            { user_id: client1.id, role: 'client', message: 'Welcome to the gym!' },
            { user_id: coach1.id, role: 'coach', message: 'Lesson successfully scheduled' },
            { user_id: secretary.id, role: 'secretary', message: 'Daily report ready' }
        ]);
        console.log('✅ System messages created successfully.');

        console.log('✨ Seed data insertion complete! Database is ready. ✨');

    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1); // Exit with error code
    }
}

// Call the seed function to populate the database
seed();
