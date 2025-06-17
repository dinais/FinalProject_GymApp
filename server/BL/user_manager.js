// // const { user, role, password } = require('../../DB/models');
// // const bcrypt = require('bcrypt');
// // const jwt = require('jsonwebtoken');
// // // פונקציות נפרדות
// // const user_manager = {
// //     async registerUser(userData) {
// //         const {
// //             first_name,
// //             last_name,
// //             address,
// //             phone,
// //             email,
// //             password,
// //             roleId
// //         } = userData;

// //         // בדוק אם התפקיד קיים
// //         const role = await role.findByPk(roleId);
// //         if (!role) {
// //             throw new Error('תפקיד לא קיים');
// //         }

// //         // בדוק אם האימייל כבר בשימוש
// //         const existing = await user.findOne({ where: { email } });
// //         if (existing) {
// //             throw new Error('האימייל כבר קיים במערכת');
// //         }

// //         // הצפן סיסמה
// //         const hashedPassword = await bcrypt.hash(password, 10);

// //         // צור את המשתמש
// //         const newUser = await user.create({
// //             first_name,
// //             last_name,
// //             address,
// //             phone,
// //             email,
// //             password_hash: hashedPassword
// //         });

// //         // שייך תפקיד למשתמש
// //         await newUser.addRole(role); // assuming Many-to-Many with addRole auto-generated

// //         return {
// //             id: newUser.id,
// //             first_name: newUser.first_name,
// //             email: newUser.email,
// //             role: role.role
// //         };
// //     },

// //  async login({ email, password: enteredPassword }) {
// //     try {
// //         const foundUser = await user.findOne({
// //             where: { email },
// //             include: [
// //                 {
// //                     model: role,
// //                     as: 'roles',
// //                     attributes: ['role']
// //                 },
// //                 {
// //                     model: password,
// //                     as: 'password', // חייב להתאים ל־as ב־association
// //                     attributes: ['hash']
// //                 }
// //             ]
// //         });

// //         if (!foundUser || !foundUser.password || !foundUser.password.hash) {
// //             return {
// //                 succeeded: false,
// //                 error: 'Invalid email or password',
// //                 data: null
// //             };
// //         }

// //         const isValid = await bcrypt.compare(enteredPassword, foundUser.password.hash);

// //         if (!isValid) {
// //             return {
// //                 succeeded: false,
// //                 error: 'Invalid email or password',
// //                 data: null
// //             };
// //         }

// //         const accessToken = jwt.sign(
// //             {
// //                 id: foundUser.id,
// //                 roles: foundUser.roles.map(r => r.role)
// //             },
// //             process.env.JWT_SECRET,
// //             { expiresIn: '1h' }
// //         );

// //         const refreshToken = jwt.sign(
// //             { id: foundUser.id },
// //             process.env.REFRESH_TOKEN_SECRET,
// //             { expiresIn: '7d' }
// //         );

// //         return {
// //             succeeded: true,
// //             error: '',
// //             data: {
// //                 accessToken,
// //                 refreshToken,
// //                 user: {
// //                     id: foundUser.id,
// //                     first_name: foundUser.first_name,
// //                     roles: foundUser.roles.map(r => r.role)
// //                 }
// //             }
// //         };

// //     } catch (err) {
// //         console.error('Login failed:', err);
// //         return {
// //             succeeded: false,
// //             error: err.message || 'Login failed',
// //             data: null
// //         };
// //     }
// // }
// // ,
// //     async getAllUsers() {
// //         return await user.findAll({
// //             include: [{ model: role, as: 'Roles', attributes: ['role'] }]
// //         });
// //     },

// //     async getUserById(id) {
// //         return await user.findByPk(id, {
// //             include: [{ model: role, as: 'Roles', attributes: ['role'] }]
// //         });
// //     },

// //     async updateUser(id, data) {
// //         const [updated] = await user.update(data, { where: { id } });
// //         return updated > 0;
// //     },

// //     async deleteUser(id) {
// //         const deleted = await user.destroy({ where: { id } });
// //         return deleted > 0;
// //     }
// // };

// // module.exports = user_manager;



// // BL/user_manager.js
// const { user, role: RoleModel, password: PasswordModel } = require('../../DB/models'); // שיניתי את שם ייבוא role ל-RoleModel למניעת התנגשות שמות
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') }); // ודא נתיב נכון ל-env

// const DAL = require('../DAL/dal'); // ייבוא שכבת ה-DAL

// const user_manager = {
//     async registerUser(userData) {
//         const {
//             first_name,
//             last_name,
//             address,
//             phone,
//             email,
//             password: rawPassword, // שם שונה למניעת התנגשות עם מודל password
//             roleName // מצפים ל-roleName במקום roleId
//         } = userData;

//         // 1. בדוק אם התפקיד קיים לפי roleName
//         const foundRole = await DAL.findAll(RoleModel, { where: { role: roleName } });
//         if (!foundRole || foundRole.length === 0) {
//             throw new Error(`תפקיד '${roleName}' לא קיים`);
//         }
//         const roleInstance = foundRole[0]; // קח את מופע התפקיד הראשון

//         // 2. בדוק אם האימייל כבר בשימוש
//         const existingUser = await DAL.findAll(user, { where: { email } });
//         if (existingUser && existingUser.length > 0) {
//             throw new Error('האימייל כבר קיים במערכת');
//         }

//         // 3. הצפן סיסמה וצור את רשומת הסיסמה
//         const hashedPassword = await bcrypt.hash(rawPassword, 10);
//         const newPasswordEntry = await DAL.create(PasswordModel, { hash: hashedPassword }); // צור רשומה במודל password

//         // 4. צור את המשתמש
//         const newUser = await DAL.create(user, {
//             first_name,
//             last_name,
//             address,
//             phone,
//             email,
//             passwordId: newPasswordEntry.id // שייך את ה-passwordId למשתמש
//         });

//         // 5. שייך תפקיד למשתמש (Many-to-Many)
//         // בהנחה שיש לך Many-to-Many עם טבלת Join בין user ל-role, Sequelize מוסיף שיטות כמו addRole
//         await newUser.addRole(roleInstance);

//         return {
//             id: newUser.id,
//             first_name: newUser.first_name,
//             email: newUser.email,
//             role: roleInstance.role // החזר את שם התפקיד
//         };
//     },

//     async login({ email, password: enteredPassword }) {
//         try {
//             const foundUser = await DAL.findAll(user, {
//                 where: { email },
//                 include: [
//                     {
//                         model: RoleModel,
//                         as: 'Roles', // בדוק שזה 'Roles' ולא 'roles' ב-association שלך
//                         attributes: ['role']
//                     },
//                     {
//                         model: PasswordModel,
//                         as: 'password', // ודא שזה 'password' ב-association שלך
//                         attributes: ['hash']
//                     }
//                 ]
//             });

//             const userInstance = foundUser[0]; // DAL.findAll מחזיר מערך

//             if (!userInstance || !userInstance.password || !userInstance.password.hash) {
//                 return {
//                     succeeded: false,
//                     error: 'אימייל או סיסמה שגויים',
//                     data: null
//                 };
//             }

//             const isValid = await bcrypt.compare(enteredPassword, userInstance.password.hash);

//             if (!isValid) {
//                 return {
//                     succeeded: false,
//                     error: 'אימייל או סיסמה שגויים',
//                     data: null
//                 };
//             }

//             // לוודא ש-userInstance.Roles קיים והוא מערך
//             const userRoles = userInstance.Roles ? userInstance.Roles.map(r => r.role) : [];

//             const accessToken = jwt.sign(
//                 {
//                     id: userInstance.id,
//                     roles: userRoles
//                 },
//                 process.env.JWT_SECRET,
//                 { expiresIn: '1h' } // טוקן גישה לטווח קצר
//             );

//             const refreshToken = jwt.sign(
//                 { id: userInstance.id },
//                 process.env.REFRESH_TOKEN_SECRET,
//                 { expiresIn: '7d' } // טוקן רענון לטווח ארוך
//             );

//             return {
//                 succeeded: true,
//                 error: '',
//                 data: {
//                     accessToken,
//                     refreshToken,
//                     user: {
//                         id: userInstance.id,
//                         first_name: userInstance.first_name,
//                         email: userInstance.email,
//                         roles: userRoles
//                     }
//                 }
//             };

//         } catch (err) {
//             console.error('Login failed in user_manager:', err);
//             return {
//                 succeeded: false,
//                 error: err.message || 'שגיאה כללית בהתחברות',
//                 data: null
//             };
//         }
//     },

//     async getAllUsers() {
//         return await DAL.findAll(user, {
//             include: [{ model: RoleModel, as: 'Roles', attributes: ['role'] }] // ודא שה-as הוא 'Roles'
//         });
//     },

//     async getUserById(id) {
//         const foundUser = await DAL.findById(user, id, {
//             include: [{ model: RoleModel, as: 'Roles', attributes: ['role'] }] // ודא שה-as הוא 'Roles'
//         });
//         // אם findById לא מוצא, הוא מחזיר null. נרצה לוודא שהתפקידים מצורפים אם הוא קיים.
//         if (foundUser && foundUser.Roles) {
//             foundUser.dataValues.roles = foundUser.Roles.map(r => r.role);
//             delete foundUser.dataValues.Roles; // נקה את השדה המקורי של Sequelize
//         }
//         return foundUser;
//     },

//     async updateUser(id, updateData) {
//         const userInstance = await DAL.findById(user, id);
//         if (!userInstance) {
//             return false; // משתמש לא נמצא
//         }

//         // אם יש סיסמה חדשה, הצפן אותה ועדכן את טבלת הסיסמאות
//         if (updateData.password) {
//             const hashedPassword = await bcrypt.hash(updateData.password, 10);
//             await DAL.update(PasswordModel, userInstance.passwordId, { hash: hashedPassword });
//             delete updateData.password; // הסר מהנתונים לפני עדכון המשתמש
//         }

//         // אם יש roleName לעדכון, טפל בשינוי תפקידים
//         if (updateData.roleName) {
//             const newRole = await DAL.findAll(RoleModel, { where: { role: updateData.roleName } });
//             if (!newRole || newRole.length === 0) {
//                 throw new Error(`תפקיד '${updateData.roleName}' לא קיים`);
//             }
//             // הסר את כל התפקידים הקיימים ושייך את התפקיד החדש
//             await userInstance.setRoles([newRole[0]]); // setRoles מחליף את כל הקשרים הקיימים
//             delete updateData.roleName; // הסר מהנתונים לפני עדכון המשתמש
//         }

//         // עדכן את שדות המשתמש (ללא הסיסמה והתפקיד שכבר טופלו)
//         const updated = await DAL.update(user, id, updateData);
//         return updated; // DAL.update כבר מחזיר בוליאני
//     },

//     async deleteUser(id) {
//         // מצא את המשתמש כדי לקבל את passwordId
//         const userToDelete = await DAL.findById(user, id);
//         if (!userToDelete) {
//             return false;
//         }

//         // מחק את רשומת הסיסמה המשויכת
//         if (userToDelete.passwordId) {
//             await DAL.remove(PasswordModel, userToDelete.passwordId);
//         }

//         // הסר את כל הקשרים לתפקידים (דרך טבלת ה-Join)
//         await userToDelete.setRoles([]); 

//         // מחק את המשתמש
//         const deleted = await DAL.remove(user, id);
//         return deleted;
//     },

//     // --- פונקציות חדשות ---

//     async getUsersByRole(roleName) {
//         const foundRole = await DAL.findAll(RoleModel, { where: { role: roleName } });
//         if (!foundRole || foundRole.length === 0) {
//             return []; // אם התפקיד לא קיים, אין משתמשים כאלה
//         }
//         const roleId = foundRole[0].id;

//         // אחזור משתמשים שמשויכים לתפקיד זה
//         // נצטרך לבצע Join דרך טבלת ה-Join. Sequelize תעשה את זה אוטומטית עם include
//         return await DAL.findAll(user, {
//             include: [{
//                 model: RoleModel,
//                 as: 'Roles',
//                 where: { id: roleId },
//                 attributes: ['role']
//             }]
//         });
//     },

//     async getAllRoles() {
//         return await DAL.findAll(RoleModel); // פשוט מחזיר את כל התפקידים
//     },

//     async refreshAccessToken(refreshToken) {
//         try {
//             // 1. ודא שתוקף ה-refreshToken תקין
//             const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

//             // 2. מצא את המשתמש (ושלוף את התפקידים המעודכנים שלו)
//             const foundUser = await DAL.findById(user, decoded.id, {
//                 include: [{
//                     model: RoleModel,
//                     as: 'Roles', // ודא שזה תואם ל-association שלך
//                     attributes: ['role']
//                 }]
//             });

//             if (!foundUser) {
//                 return { succeeded: false, error: 'משתמש לא נמצא עבור רענון טוקן' };
//             }

//             const userRoles = foundUser.Roles ? foundUser.Roles.map(r => r.role) : [];

//             // 3. צור accessToken חדש
//             const newAccessToken = jwt.sign(
//                 { id: foundUser.id, roles: userRoles },
//                 process.env.JWT_SECRET,
//                 { expiresIn: '15m' } // תקופת תוקף קצרה יותר ל-accessToken
//             );

//             // 4. אופציונלי: צור גם refreshToken חדש (רוטציה של רענון טוקנים לאבטחה נוספת)
//             // אם תחליט ליישם את זה, שים לב שזה דורש שמירה של ה-refreshToken ב-DB
//             // כדי לבטל טוקנים קודמים, או לוודא שכל טוקן רענון יכול לשמש רק פעם אחת.
//             // כרגע, נחזיר רק accessToken חדש.
//             // const newRefreshToken = jwt.sign(
//             //     { id: foundUser.id },
//             //     process.env.REFRESH_TOKEN_SECRET,
//             //     { expiresIn: '7d' }
//             // );

//             return {
//                 succeeded: true,
//                 error: '',
//                 data: {
//                     accessToken: newAccessToken,
//                     // newRefreshToken: newRefreshToken // אם תבחר להחזיר
//                 }
//             };

//         } catch (err) {
//             console.error('Error in refreshAccessToken BL:', err);
//             // העבר את השגיאה הלאה כדי שה-controller יטפל בהודעות ספציפיות כמו 'TokenExpiredError'
//             throw err;
//         }
//     }
// };

// module.exports = user_manager;



// BL/user_manager.js
const { user, role: RoleModel, password: PasswordModel } = require('../../DB/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') }); // ודא נתיב נכון ל-env

const DAL = require('../DAL/dal');

const user_manager = {
    async registerUser(userData) {
        const {
            first_name,
            last_name,
            street_name,
            house_number,
            apartment_number,
            city,
            zip_code,
            country,
            phone,
            email,
            password: rawPassword,
            roleName
        } = userData;

        const foundRole = await DAL.findAll(RoleModel, { where: { role: roleName } });
        if (!foundRole || foundRole.length === 0) {
            throw new Error(`תפקיד '${roleName}' לא קיים`);
        }
        const roleInstance = foundRole[0];

        const existingUser = await DAL.findAll(user, { where: { email } });
        if (existingUser && existingUser.length > 0) {
            throw new Error('האימייל כבר קיים במערכת');
        }

        // 1. צור את המשתמש קודם כדי שיהיה לו ID
        const newUser = await DAL.create(user, {
            first_name,
            last_name,
            street_name,
            house_number,
            apartment_number,
            city,
            zip_code,
            country,
            phone,
            email,
            // אין passwordId כאן, כי ה-FK הוא בטבלת password
        });

        // 2. הצפן סיסמה וצור את רשומת הסיסמה, מקשר עם ה-ID של המשתמש החדש
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        await DAL.create(PasswordModel, { hash: hashedPassword, user_id: newUser.id }); // <--- תיקון כאן: הוספת user_id

        // 3. שייך תפקיד למשתמש (Many-to-Many)
        await newUser.addRole(roleInstance);

        return {
            id: newUser.id,
            first_name: newUser.first_name,
            email: newUser.email,
            role: roleInstance.role
        };
    },

    async login({ email, password: enteredPassword }) {
        try {
            const foundUser = await DAL.findAll(user, {
                where: { email },
                include: [
                    {
                        model: RoleModel,
                        as: 'roles', // *** תיקון: וודא שזה 'roles' (אות קטנה) כאן ***
                        attributes: ['role']
                    },
                    {
                        model: PasswordModel,
                        as: 'password',
                        attributes: ['hash']
                    }
                ]
            });

            const userInstance = foundUser[0];

            if (!userInstance || !userInstance.password || !userInstance.password.hash) {
                return {
                    succeeded: false,
                    error: 'אימייל או סיסמה שגויים',
                    data: null
                };
            }

            const isValid = await bcrypt.compare(enteredPassword, userInstance.password.hash);

            if (!isValid) {
                return {
                    succeeded: false,
                    error: 'אימייל או סיסמה שגויים',
                    data: null
                };
            }

            const userRoles = userInstance.roles ? userInstance.roles.map(r => r.role) : []; // *** תיקון: ודא גישה ל-userInstance.roles ***

            const accessToken = jwt.sign(
                {
                    id: userInstance.id,
                    roles: userRoles
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                { id: userInstance.id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );

            return {
                succeeded: true,
                error: '',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: userInstance.id,
                        first_name: userInstance.first_name,
                        last_name: userInstance.last_name,
                        street_name: userInstance.street_name,
                        house_number: userInstance.house_number,
                        apartment_number: userInstance.apartment_number,
                        city: userInstance.city,
                        zip_code: userInstance.zip_code,
                        country: userInstance.country,
                        phone: userInstance.phone,
                        email: userInstance.email,
                        roles: userRoles
                    }
                }
            };

        } catch (err) {
            console.error('Login failed in user_manager:', err);
            return {
                succeeded: false,
                error: err.message || 'שגיאה כללית בהתחברות',
                data: null
            };
        }
    },

    async getAllUsers() {
        return await DAL.findAll(user, {
            include: [{ model: RoleModel, as: 'roles', attributes: ['role'] }] // *** תיקון: וודא שה-as הוא 'roles' ***
        });
    },

    async getUserById(id) {
        const foundUser = await DAL.findById(user, id, {
            include: [{ model: RoleModel, as: 'roles', attributes: ['role'] }] // *** תיקון: וודא שה-as הוא 'roles' ***
        });
        if (foundUser && foundUser.roles) { // *** תיקון: ודא גישה ל-foundUser.roles ***
            foundUser.dataValues.roles = foundUser.roles.map(r => r.role);
            // אין צורך ב-delete foundUser.dataValues.Roles אם אנחנו עקביים עם 'roles'
        }
        return foundUser;
    },

    async updateUser(id, updateData) {
        // טען את המשתמש כולל הסיסמה שלו
        const userInstance = await DAL.findById(user, id, {
            include: [{ model: PasswordModel, as: 'password', attributes: ['id', 'hash'] }]
        });
        if (!userInstance) {
            return false;
        }

        // אם יש סיסמה חדשה, הצפן אותה ועדכן את טבלת הסיסמאות
        if (updateData.password) {
            const hashedPassword = await bcrypt.hash(updateData.password, 10);
            if (userInstance.password) { // אם כבר קיימת סיסמה
                await DAL.update(PasswordModel, userInstance.password.id, { hash: hashedPassword });
            } else { // אם אין סיסמה (מקרה קצה)
                await DAL.create(PasswordModel, { hash: hashedPassword, user_id: userInstance.id });
            }
            delete updateData.password; // הסר מהנתונים לפני עדכון המשתמש
        }

        // אם יש roleName לעדכון, טפל בשינוי תפקידים
        if (updateData.roleName) {
            const newRole = await DAL.findAll(RoleModel, { where: { role: updateData.roleName } });
            if (!newRole || newRole.length === 0) {
                throw new Error(`תפקיד '${updateData.roleName}' לא קיים`);
            }
            await userInstance.setRoles([newRole[0]]); // setRoles מחליף את כל הקשרים הקיימים
            delete updateData.roleName; // הסר מהנתונים לפני עדכון המשתמש
        }

        // עדכן את שדות המשתמש (ללא הסיסמה והתפקיד שכבר טופלו)
        const updated = await DAL.update(user, id, updateData);
        return updated;
    },

    async deleteUser(id) {
        const userToDelete = await DAL.findById(user, id, {
            include: [{ model: PasswordModel, as: 'password', attributes: ['id'] }] // טען את ID הסיסמה
        });
        if (!userToDelete) {
            return false;
        }

        // מחק את רשומת הסיסמה המשויכת
        if (userToDelete.password && userToDelete.password.id) { // ודא שהסיסמה קיימת
            await DAL.remove(PasswordModel, userToDelete.password.id);
        }

        // הסר את כל הקשרים לתפקידים (דרך טבלת ה-Join)
        await userToDelete.setRoles([]);

        // מחק את המשתמש
        const deleted = await DAL.remove(user, id);
        return deleted;
    },

    async getUsersByRole(roleName) {
        const foundRole = await DAL.findAll(RoleModel, { where: { role: roleName } });
        if (!foundRole || foundRole.length === 0) {
            return [];
        }
        const roleId = foundRole[0].id;

        return await DAL.findAll(user, {
            include: [{
                model: RoleModel,
                as: 'roles', // *** תיקון: וודא שה-as הוא 'roles' ***
                where: { id: roleId },
                attributes: ['role']
            }]
        });
    },

    async getAllRoles() {
        return await DAL.findAll(RoleModel);
    },

    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            const foundUser = await DAL.findById(user, decoded.id, {
                include: [{
                    model: RoleModel,
                    as: 'roles', // *** תיקון: וודא שה-as הוא 'roles' ***
                    attributes: ['role']
                }]
            });

            if (!foundUser) {
                return { succeeded: false, error: 'משתמש לא נמצא עבור רענון טוקן' };
            }

            const userRoles = foundUser.roles ? foundUser.roles.map(r => r.role) : []; // *** תיקון: ודא גישה ל-foundUser.roles ***

            const newAccessToken = jwt.sign(
                { id: foundUser.id, roles: userRoles },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            return {
                succeeded: true,
                error: '',
                data: {
                    accessToken: newAccessToken,
                }
            };

        } catch (err) {
            console.error('Error in refreshAccessToken BL:', err);
            throw err;
        }
    }
};

module.exports = user_manager;