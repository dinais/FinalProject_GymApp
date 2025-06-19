// BL/user_manager.js
const { user, role: RoleModel, password: PasswordModel, sequelize } = require('../../DB/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const DAL = require('../DAL/dal');

const user_manager = {
    /**
     * רישום משתמש חדש על ידי מזכירה. המשתמש נוצר ללא סיסמה ראשונית.
     * הסיסמה תוגדר על ידי המשתמש בנפרד (דרך קישור שנשלח אליו).
     * @param {object} userData - נתוני המשתמש לרישום (ללא סיסמה)
     * @returns {object} - פרטי המשתמש החדש או המשתמש שהופעל מחדש
     */
    async registerUser(userData) {
        const {
            first_name, last_name, id_number,
            street_name, house_number, apartment_number,
            city, zip_code, country, phone, email,
            roleName
        } = userData;

        // 1. בדוק אם התפקיד קיים לפי roleName
        const foundRole = await DAL.findAll(RoleModel, { where: { role: roleName } });
        if (!foundRole || foundRole.length === 0) {
            throw new Error(`תפקיד '${roleName}' לא קיים`);
        }
        const roleInstance = foundRole[0];

        // 2. בדוק אם האימייל כבר בשימוש
        // NEW: נטפל בתרחיש של משתמש לא פעיל
        const existingUserArray = await DAL.findAll(user, {
            where: { email },
            include: [{ model: RoleModel, as: 'roles' }] // טען תפקידים קיימים
        });
        const existingUser = existingUserArray[0]; // קח את המשתמש הראשון אם נמצא

        if (existingUser) {
            // אם המשתמש קיים
            if (existingUser.is_active) {
                // אם המשתמש קיים ופעיל - זרוק שגיאה
                throw new Error('האימייל כבר קיים במערכת ופעיל.');
            } else {
                // אם המשתמש קיים אבל לא פעיל - הפעל אותו מחדש ועדכן פרטים
                console.log(`משתמש עם אימייל ${email} נמצא ולא פעיל. מפעיל אותו מחדש.`);

                // עדכן את השדות הרלוונטיים (מלבד סיסמה שזה תהליך נפרד)
                await DAL.update(user, existingUser.id, {
                    first_name, last_name, id_number,
                    street_name, house_number, apartment_number,
                    city, zip_code, country, phone, email,
                    is_active: true // הפעל מחדש
                });

                // ודא שהתפקיד הנכון משויך (setRoles יחליף תפקידים קיימים)
                await existingUser.setRoles([roleInstance]);

                // החזר את פרטי המשתמש המעודכנים
                const updatedUser = await DAL.findById(user, existingUser.id, {
                    include: [{ model: RoleModel, as: 'roles', attributes: ['role'] }]
                });

                return {
                    id: updatedUser.id,
                    first_name: updatedUser.first_name,
                    email: updatedUser.email,
                    role: updatedUser.roles ? updatedUser.roles.map(r => r.role)[0] : null, // קח את התפקיד הראשון
                    isReactivated: true // אינדיקטור שהמשתמש הופעל מחדש
                };
            }
        }

        // 3. אם המשתמש לא קיים כלל, צור משתמש חדש
        const newUser = await DAL.create(user, {
            first_name, last_name, id_number,
            street_name, house_number, apartment_number,
            city, zip_code, country, phone, email,
            is_active: true // ברירת מחדל
        });

        // 4. שייך תפקיד למשתמש החדש
        await newUser.addRole(roleInstance);

        return {
            id: newUser.id,
            first_name: newUser.first_name,
            email: newUser.email,
            role: roleInstance.role,
            isReactivated: false // אינדיקטור שהמשתמש נוצר לראשונה
        };
    },

    /**
     * כניסת משתמש למערכת.
     * @param {object} credentials - אובייקט המכיל email ו-password.
     * @returns {object} - תוצאת ההתחברות (succeeded, error, data: {accessToken, refreshToken, user})
     */
    async login({ email, password: enteredPassword }) {
        try {
            const foundUser = await DAL.findAll(user, {
                where: { email },
                include: [
                    {
                        model: RoleModel,
                        as: 'roles',
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

            if (!userInstance) { // אם המשתמש בכלל לא נמצא
                return {
                    succeeded: false,
                    error: 'אימייל או סיסמה שגויים.',
                    data: null
                };
            }

            // אם המשתמש קיים אבל אין לו סיסמה, אולי כדאי להחזיר הודעה אחרת:
            // 'החשבון קיים אך לא הוגדרה סיסמה. אנא קבע/אפס סיסמה.'
            if (!userInstance.password || !userInstance.password.hash) {
                return {
                    succeeded: false,
                    error: 'החשבון קיים אך לא הוגדרה סיסמה. אנא קבע סיסמה.', // הודעה ספציפית
                    data: null
                };
            }

            // בדיקת סטטוס פעיל
            if (!userInstance.is_active) {
                return {
                    succeeded: false,
                    error: 'החשבון שלך אינו פעיל. אנא צור קשר עם ההנהלה.',
                    data: null
                };
            }

            // השוואת סיסמאות
            const isValid = await bcrypt.compare(enteredPassword, userInstance.password.hash);

            if (!isValid) {
                return {
                    succeeded: false,
                    error: 'אימייל או סיסמה שגויים',
                    data: null
                };
            }

            const userRoles = userInstance.roles ? userInstance.roles.map(r => r.role) : [];

            // יצירת Access Token
            const accessToken = jwt.sign(
                {
                    id: userInstance.id,
                    roles: userRoles
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // יצירת Refresh Token
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
                        email: userInstance.email,
                        phone: userInstance.phone,
                        roles: userRoles,
                        street_name: userInstance.street_name,
                        house_number: userInstance.house_number,
                        apartment_number: userInstance.apartment_number,
                        city: userInstance.city,
                        zip_code: userInstance.zip_code,
                        country: userInstance.country,
                        id_number: userInstance.id_number,
                        is_active: userInstance.is_active
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

    /**
     * שליפת כל המשתמשים.
     * @param {boolean} includeInactive - האם לכלול משתמשים לא פעילים (ברירת מחדל: false).
     * @returns {Array<object>} - מערך של אובייקטי משתמשים.
     */
    async getAllUsers(includeInactive = false) {
        const whereClause = includeInactive ? {} : { is_active: true };
        return await DAL.findAll(user, {
            where: whereClause,
            include: [{ model: RoleModel, as: 'roles', attributes: ['role'] }]
        });
    },

    /**
     * שליפת משתמש לפי ID.
     * @param {number} id - מזהה המשתמש.
     * @param {boolean} includeInactive - האם לאפשר שליפת משתמש לא פעיל (ברירת מחדל: false).
     * @returns {object|null} - אובייקט המשתמש או null אם לא נמצא או לא פעיל.
     */
    async getUserById(id, includeInactive = false) {
        const whereClause = includeInactive ? { id } : { id, is_active: true };
        const foundUser = await DAL.findAll(user, {
            where: whereClause,
            include: [{ model: RoleModel, as: 'roles', attributes: ['role'] }]
        });
        const userInstance = foundUser[0] || null;

        if (userInstance && userInstance.roles) {
            userInstance.dataValues.roles = userInstance.roles.map(r => r.role);
        }
        return userInstance;
    },

    /**
     * עדכון פרטי משתמש.
     * @param {number} id - מזהה המשתמש לעדכון.
     * @param {object} updateData - הנתונים לעדכון.
     * @returns {boolean} - true אם עודכן בהצלחה, false אחרת.
     */
    async updateUser(id, updateData) {
        const userInstance = await DAL.findById(user, id, {
            include: [{ model: PasswordModel, as: 'password', attributes: ['id', 'hash'] }]
        });
        if (!userInstance) {
            return false;
        }

        if (updateData.password) {
            const hashedPassword = await bcrypt.hash(updateData.password, 10);
            if (userInstance.password) {
                await DAL.update(PasswordModel, userInstance.password.id, { hash: hashedPassword });
            } else {
                await DAL.create(PasswordModel, { hash: hashedPassword, user_id: userInstance.id });
            }
            delete updateData.password;
        }

        if (updateData.roleName) {
            const newRole = await DAL.findAll(RoleModel, { where: { role: updateData.roleName } });
            if (!newRole || newRole.length === 0) {
                throw new Error(`תפקיד '${updateData.roleName}' לא קיים`);
            }
            await userInstance.setRoles([newRole[0]]);
            delete updateData.roleName;
        }

        const updated = await DAL.update(user, id, updateData);
        return updated;
    },

    /**
     * ביצוע "מחיקה רכה" למשתמש (שינוי סטטוס is_active ל-false).
     * @param {number} id - מזהה המשתמש ל"מחיקה".
     * @returns {boolean} - true אם הסטטוס שונה בהצלחה, false אחרת.
     */
    async softDeleteUser(id) {
        try {
            const userToDeactivate = await DAL.findById(user, id);
            if (!userToDeactivate) {
                return false;
            }
            // ודא שהמשתמש פעיל לפני שמנסים להשבית אותו
            if (!userToDeactivate.is_active) {
                console.log(`User ${id} is already inactive.`);
                return false; // כבר לא פעיל
            }
            const updated = await DAL.update(user, id, { is_active: false });
            return updated;
        } catch (error) {
            console.error('Error in user_manager.softDeleteUser:', error);
            throw error;
        }
    },

    /**
     * הפעלת משתמש מחדש (שינוי סטטוס is_active ל-true).
     * @param {number} id - מזהה המשתמש להפעלה מחדש.
     * @returns {boolean} - true אם הסטטוס שונה בהצלחה, false אחרת.
     */
    async activateUser(id) {
        try {
            const userToActivate = await DAL.findById(user, id);
            if (!userToActivate) {
                return false;
            }
            // ודא שהמשתמש לא פעיל לפני שמנסים להפעיל אותו
            if (userToActivate.is_active) {
                console.log(`User ${id} is already active.`);
                return false; // כבר פעיל
            }
            const updated = await DAL.update(user, id, { is_active: true });
            return updated;
        } catch (error) {
            console.error('Error in user_manager.activateUser:', error);
            throw error;
        }
    },

    /**
     * שליפת מתאמנים בלבד (משתמשים עם תפקיד 'client').
     * @param {boolean} includeInactive - האם לכלול מתאמנים לא פעילים (ברירת מחדל: false).
     * @returns {Array<object>} - מערך של אובייקטי מתאמנים.
     */
    async getUsersByRole(roleName, includeInactive = false) {
        const foundRole = await DAL.findAll(RoleModel, { where: { role: roleName } });
        if (!foundRole || foundRole.length === 0) {
            return [];
        }
        const roleId = foundRole[0].id;

        const whereClause = includeInactive ? {} : { is_active: true };

        return await DAL.findAll(user, {
            where: whereClause,
            include: [{
                model: RoleModel,
                as: 'roles',
                where: { id: roleId },
                attributes: ['role']
            }]
        });
    },

    /**
     * שליפת כל התפקידים הזמינים במערכת.
     * @returns {Array<object>} - מערך של אובייקטי תפקידים.
     */
    async getAllRoles() {
        return await DAL.findAll(RoleModel);
    },

    /**
     * רענון טוקן גישה באמצעות רענון טוקן.
     * @param {string} refreshToken - טוקן הרענון.
     * @returns {object} - תוצאת הרענון (succeeded, error, data: {accessToken, newRefreshToken})
     */
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            const foundUser = await DAL.findById(user, decoded.id, {
                include: [{
                    model: RoleModel,
                    as: 'roles',
                    attributes: ['role']
                }]
            });

            if (!foundUser) {
                return { succeeded: false, error: 'משתמש לא נמצא עבור רענון טוקן' };
            }

            if (!foundUser.is_active) {
                return { succeeded: false, error: 'החשבון שלך אינו פעיל. לא ניתן לרענן טוקן.' };
            }


            const userRoles = foundUser.roles ? foundUser.roles.map(r => r.role) : [];

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
    },

    /**
     * פונקציה לקביעה או עדכון של סיסמת משתמש (לדוגמה: דרך קישור איפוס סיסמה).
     * @param {number} userId - מזהה המשתמש שעבורו נקבעת הסיסמה.
     * @param {string} newPassword - הסיסמה החדשה (plain text).
     * @returns {boolean} - true אם הסיסמה הוגדרה/עודכנה בהצלחה.
     */
    async setPassword(userId, newPassword) {
        const userToUpdate = await DAL.findById(user, userId);
        if (!userToUpdate) {
            throw new Error('משתמש לא נמצא');
        }

        const existingPasswordEntry = await DAL.findOne(PasswordModel, { where: { user_id: userId } });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (existingPasswordEntry) {
            const updated = await DAL.update(PasswordModel, existingPasswordEntry.id, { hash: hashedPassword });
            return updated;
        } else {
            const newPasswordInstance = await DAL.create(PasswordModel, { hash: hashedPassword, user_id: userId });
            return !!newPasswordInstance;
        }
    }
};

module.exports = user_manager;