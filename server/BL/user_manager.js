// BL/user_manager.js
const { user, role: RoleModel, password: PasswordModel, user_role, sequelize } = require('../../DB/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const DAL = require('../DAL/dal');

const user_manager = {
    /**
     * רישום משתמש חדש על ידי מזכירה. המשתמש נוצר ללא סיסמה ראשונית.
     * הסיסמה תוגדר על ידי המשתמש בנפרד (דרך קישור שנשלח אליו).
     * מטפל במצבים:
     * 1. משתמש חדש לחלוטין.
     * 2. משתמש קיים ולא פעיל (מפעיל אותו מחדש ומעדכן פרטים ותפקיד).
     * 3. משתמש קיים ופעיל (מוסיף לו את התפקיד החדש אם אינו קיים כבר).
     * @param {object} userData - נתוני המשתמש לרישום (ללא סיסמה)
     * @returns {object} - פרטי המשתמש החדש או המשתמש שהופעל מחדש/עודכן תפקיד
     */
    async registerUser(userData) {
        try {
            console.log('[UserManager] Attempting to register or update user:', userData.id_number);

            let newUser = null;
            let isExistingUserUpdated = false;

            // בדיקה אם המשתמש כבר קיים לפי ת"ז או אימייל
            let existingUser = await DAL.findOne(user, {
                where: {
                    [Op.or]: [
                        { id_number: userData.id_number },
                        { email: userData.email }
                    ]
                },
                include: [{
                    model: RoleModel,
                    as: 'roles',
                    attributes: ['id', 'role'], // וודא ש-ID כלול
                    through: { attributes: ['is_active'] }
                }]
            });

            if (existingUser) {
                console.log(`[UserManager] User ${existingUser.id_number} already exists. Updating details.`);
                await DAL.update(user, existingUser.id, userData);
                newUser = existingUser;
                isExistingUserUpdated = true;
            } else {
                console.log('[UserManager] Creating new user.');
                newUser = await DAL.create(user, userData);
            }

            const roleObject = await DAL.findOne(RoleModel, { where: { role: userData.roleName } });
            if (!roleObject) {
                throw new Error(`תפקיד '${userData.roleName}' לא נמצא במערכת.`);
            }

            const [userRoleEntry, created] = await user_role.findOrCreate({
                where: { user_id: newUser.id, role_id: roleObject.id },
                defaults: { is_active: true }
            });

            if (!created && !userRoleEntry.is_active) {
                console.log(`[UserManager] Reactivating role '${userData.roleName}' for user ${newUser.id}.`);
                await userRoleEntry.update({ is_active: true });
            } else if (created) {
                console.log(`[UserManager] Created new user-role link for user ${newUser.id} with role '${userData.roleName}'.`);
            } else {
                console.log(`[UserManager] User ${newUser.id} already has active role '${userData.roleName}'.`);
            }

            if (!newUser.is_active) {
                console.log(`[UserManager] Activating user ${newUser.id} globally as a new role was added/activated.`);
                await DAL.update(user, newUser.id, { is_active: true });
                newUser.is_active = true;
            }

            const finalUser = await DAL.findById(user, newUser.id, {
                include: [{
                    model: RoleModel,
                    as: 'roles',
                    attributes: ['id', 'role'], // וודא ש-ID כלול
                    through: { attributes: ['is_active'] }
                }]
            });

            return { message: isExistingUserUpdated ? 'המשתמש עודכן בהצלחה.' : 'המשתמש נרשם בהצלחה.', user: finalUser, isExistingUserUpdated };

        } catch (error) {
            console.error('🚨 Error in BL/user_manager.js registerUser:', error);
            throw error;
        }
    },


    /**
     * כניסת משתמש למערכת.
     * @param {object} credentials - אובייקט המכיל email ו-password.
     * @returns {object} - תוצאת ההתחברות (succeeded, error, data: {accessToken, refreshToken, user})
     */
    async login({ email, password: enteredPassword }) {
        try {
            console.log('--- Starting login process for:', email, '---');
            const foundUser = await DAL.findOne(user, {
                where: { email },
                include: [
                    {
                        model: RoleModel,
                        as: 'roles',
                        attributes: ['id', 'role'], // וודא ש-ID כלול
                        through: { attributes: ['is_active'] }
                    },
                    {
                        model: PasswordModel,
                        as: 'password',
                        attributes: ['hash']
                    }
                ]
            });

            console.log('Found User (before filtering roles):', JSON.stringify(foundUser, null, 2));

            if (!foundUser) {
                console.log('Login failed: User not found with this email.');
                return {
                    succeeded: false,
                    error: 'אימייל או סיסמה שגויים.',
                    data: null
                };
            }

            if (!foundUser.password || !foundUser.password.hash) {
                console.log('Login failed: Password not set for user ID', foundUser.id);
                return {
                    succeeded: false,
                    error: 'החשבון קיים אך לא הוגדרה סיסמה. אנא קבע סיסמה.',
                    data: null
                };
            }

            if (!foundUser.is_active) {
                console.log('Login failed: Account inactive globally for user ID', foundUser.id);
                return {
                    succeeded: false,
                    error: 'החשבון שלך אינו פעיל. אנא צור קשר עם ההנהלה.',
                    data: null
                };
            }

            const isValid = await bcrypt.compare(enteredPassword, foundUser.password.hash);

            if (!isValid) {
                console.log('Login failed: Incorrect password for user ID', foundUser.id);
                return {
                    succeeded: false,
                    error: 'אימייל או סיסמה שגויים',
                    data: null
                };
            }

            // 💡 חשוב: שליפת תפקידים פעילים בלבד. גישה ל-UserRole (עם 'U' גדולה)
            const activeUserRoles = foundUser.roles
                ? foundUser.roles.filter(r => {
                    // **התיקון כאן:** גישה ל-r.UserRole ולא ל-r.user_role
                    console.log(`Checking role: ${r.role} (ID: ${r.id}), UserRole object: ${JSON.stringify(r.UserRole)}`);
                    return r.UserRole && r.UserRole.is_active;
                }).map(r => r.role)
                : [];

            console.log('Active Roles after filter:', activeUserRoles);

            if (activeUserRoles.length === 0) {
                console.log('Login failed: No active roles found for user ID', foundUser.id);
                return {
                    succeeded: false,
                    error: 'אין לך תפקידים פעילים במערכת. אנא צור קשר עם ההנהלה.',
                    data: null
                };
            }

            const accessToken = jwt.sign(
                {
                    id: foundUser.id,
                    roles: activeUserRoles
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                { id: foundUser.id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );

            console.log('Login succeeded for user ID:', foundUser.id);
            console.log('--- End login process ---');

            return {
                succeeded: true,
                error: '',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: foundUser.id,
                        first_name: foundUser.first_name,
                        last_name: foundUser.last_name,
                        email: foundUser.email,
                        phone: foundUser.phone,
                        roles: activeUserRoles,
                        street_name: foundUser.street_name,
                        house_number: foundUser.house_number,
                        apartment_number: foundUser.apartment_number,
                        city: foundUser.city,
                        zip_code: foundUser.zip_code,
                        country: foundUser.country,
                        id_number: foundUser.id_number,
                        is_active: foundUser.is_active
                    }
                }
            };

        } catch (err) {
            console.error('Login failed in user_manager (catch block):', err);
            return {
                succeeded: false,
                error: err.message || 'שגיאה כללית בהתחברות',
                data: null
            };
        }
    },

    /**
     * שליפת כל המשתמשים.
     * @param {boolean} includeInactive - האם לכלול משתמשים לא פעילים גלובלית (ברירת מחדל: false).
     * @returns {Array<object>} - מערך של אובייקטי משתמשים.
     */
    async getAllUsers(includeInactive = false) {
        const whereClause = includeInactive ? {} : { is_active: true };
        const users = await DAL.findAll(user, {
            where: whereClause,
            include: [{
                model: RoleModel,
                as: 'roles',
                attributes: ['id', 'role'], // וודא ש-ID כלול
                through: { attributes: ['is_active'] }
            }]
        });

        return users.map(userInstance => {
            const roles = userInstance.roles || [];
            const activeRoles = userInstance.is_active
                ? roles.filter(r => r.UserRole?.is_active).map(r => r.role) // **התיקון כאן:** גישה ל-r.UserRole
                : [];
            return { ...userInstance.dataValues, roles: activeRoles, is_active: userInstance.is_active };
        });
    },

    /**
     * שליפת משתמש לפי ID.
     * @param {number} id - מזהה המשתמש.
     * @param {boolean} includeInactive - האם לאפשר שליפת משתמש לא פעיל גלובלית (ברירת מחדל: false).
     * @returns {object|null} - אובייקט המשתמש או null אם לא נמצא או לא פעיל גלובלית.
     */
    async getUserById(id, includeInactive = false) {
        const userInstance = await DAL.findOne(user, {
            where: { id },
            include: [{
                model: RoleModel,
                as: 'roles',
                attributes: ['id', 'role'], // וודא ש-ID כלול
                through: { attributes: ['is_active'] }
            }]
        });

        if (!userInstance) {
            return null;
        }

        if (!includeInactive && !userInstance.is_active) {
            return null;
        }

        const roles = userInstance.roles || [];
        const activeRoles = userInstance.is_active
            ? roles.filter(r => r.UserRole?.is_active).map(r => r.role) // **התיקון כאן:** גישה ל-r.UserRole
            : [];

        return { ...userInstance.dataValues, roles: activeRoles, is_active: userInstance.is_active };
    },

    /**
     * עדכון פרטי משתמש.
     * @param {number} id - מזהה המשתמש לעדכון.
     * @param {object} updateData - הנתונים לעדכון.
     * @returns {boolean} - true אם עודכן בהצלחה, false אחרת.
     */
    async updateUser(id, updateData) {
        const userInstance = await DAL.findById(user, id, {
            include: [
                { model: PasswordModel, as: 'password', attributes: ['id', 'hash'] },
                { model: RoleModel, as: 'roles', through: { attributes: ['is_active'] } }
            ]
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
            const roleToUpdate = await DAL.findOne(RoleModel, { where: { role: updateData.roleName } });
            if (!roleToUpdate) {
                throw new Error(`תפקיד '${updateData.roleName}' לא קיים`);
            }
            await userInstance.addRole(roleToUpdate, { through: { is_active: true } });
            delete updateData.roleName;
        }

        if (Object.prototype.hasOwnProperty.call(updateData, 'is_active')) {
            const newIsActiveStatus = updateData.is_active;
            const allCurrentRoles = await userInstance.getRoles();
            for (const role of allCurrentRoles) {
                await userInstance.addRole(role, { through: { is_active: newIsActiveStatus } });
            }
        }

        const updated = await DAL.update(user, id, updateData);
        return updated;
    },

    /**
     * ביצוע "מחיקה רכה" למשתמש (שינוי סטטוס is_active ל-false).
     * בנוסף, כל התפקידים של המשתמש בטבלת ה-join (user_roles) יסומנו כלא פעילים.
     * @param {number} id - מזהה המשתמש ל"מחיקה".
     * @returns {boolean} - true אם הסטטוס שונה בהצלחה, false אחרת.
     */
     async softDeleteUser(userId, roleName) {
        try {
            console.log(`[UserManager] Attempting soft delete for user ${userId}, role: ${roleName}`);

            const existingUser = await DAL.findById(user, userId, {
                include: [{
                    model: RoleModel,
                    as: 'roles',
                    attributes: ['id', 'role'], // וודא ש-ID כלול
                    through: { attributes: ['is_active', 'user_id', 'role_id'] }
                }]
            });

            if (!existingUser) {
                console.warn(`[UserManager] User ${userId} not found.`);
                throw new Error('משתמש לא נמצא.');
            }

            if (!roleName) {
                console.warn(`[UserManager] roleName is undefined or null.`);
                throw new Error('שם התפקיד חסר עבור פעולת המחיקה הרכה.');
            }
            const roleToDeactivateObj = await DAL.findOne(RoleModel, { where: { role: roleName } });
            if (!roleToDeactivateObj) {
                console.warn(`[UserManager] Role '${roleName}' not found in roles table.`);
                throw new Error(`תפקיד '${roleName}' לא קיים במערכת.`);
            }

            const userRoleEntry = existingUser.roles.find(r =>
                r.id === roleToDeactivateObj.id && r.UserRole // **התיקון כאן:** גישה ל-r.UserRole
            );

            if (!userRoleEntry) {
                console.warn(`[UserManager] User ${userId} does not have role '${roleName}'.`);
                return false;
            }

            if (!userRoleEntry.UserRole.is_active) { // **התיקון כאן:** גישה ל-UserRole
                console.log(`[UserManager] Role '${roleName}' for user ${userId} is already inactive.`);
                return true;
            }

            console.log(`[UserManager] Deactivating role '${roleName}' for user ${userId} in user_role table.`);
            await user_role.update(
                { is_active: false },
                { where: { user_id: userId, role_id: roleToDeactivateObj.id } }
            );

            const remainingActiveRolesCount = await user_role.count({
                where: {
                    user_id: userId,
                    is_active: true
                }
            });

            if (remainingActiveRolesCount === 0) {
                if (existingUser.is_active) {
                    console.log(`[UserManager] User ${userId} has no active roles left. Deactivating user globally.`);
                    await DAL.update(user, userId, { is_active: false });
                } else {
                    console.log(`[UserManager] User ${userId} already inactive globally and has no active roles.`);
                }
            } else {
                if (!existingUser.is_active) {
                    console.log(`[UserManager] User ${userId} still has active roles. Activating user globally.`);
                    await DAL.update(user, userId, { is_active: true });
                } else {
                    console.log(`[UserManager] User ${userId} still has active roles. Global status remains active.`);
                }
            }

            console.log(`[UserManager] Soft delete of role '${roleName}' for user ${userId} successful.`);
            return true;

        } catch (error) {
            console.error('🚨 Error in BL/user_manager.js softDeleteUser:', error);
            throw error;
        }
    },

    /**
     * הפעלת משתמש מחדש (שינוי סטטוס is_active ל-true).
     * בנוסף, כל התפקידים של המשתמש בטבלת ה-join (user_roles) יסומנו כפעילים.
     * @param {number} id - מזהה המשתמש להפעלה מחדש.
     * @returns {boolean} - true אם הסטטוס שונה בהצלחה, false אחרת.
     */
    async activateUser(userId) {
        try {
            console.log(`[activateUser Debug] - Attempting to activate user ${userId}.`);
            const existingUser = await DAL.findById(user, userId, {
                include: [{
                    model: RoleModel,
                    as: 'roles',
                    attributes: ['id', 'role'], // וודא ש-ID כלול
                    through: { attributes: ['is_active'] }
                }]
            });

            if (!existingUser) {
                console.warn(`[activateUser Debug] - User ${userId} not found for activation.`);
                return false;
            }

            if (existingUser.is_active) {
                console.log(`[activateUser Debug] - User ${userId} is already active globally.`);
                return true;
            }

            await DAL.update(user, userId, { is_active: true });
            console.log(`[activateUser Debug] - User ${userId} activated globally.`);

            const allUserRoles = await user_role.findAll({ where: { user_id: userId } });
            for (const ur of allUserRoles) {
                if (!ur.is_active) {
                    await user_role.update({ is_active: true }, { where: { user_id: userId, role_id: ur.role_id } });
                    console.log(`[activateUser Debug] - Role ${ur.role_id} for user ${userId} activated.`);
                }
            }
            console.log(`[activateUser Debug] - All roles for user ${userId} activated.`);
            return true;
        } catch (error) {
            console.error('🚨 Error in BL/user_manager.js activateUser:', error);
            throw error;
        }
    },

    /**
     * שליפת משתמשים לפי תפקיד ספציפי (לדוגמה, 'client' או 'coach').
     * @param {string} roleName - שם התפקיד.
     * @param {boolean} includeInactiveGlobalUsers - האם לכלול משתמשים לא פעילים גלובלית (ברירת מחדל: false).
     * @returns {Array<object>} - מערך של אובייקטי משתמשים עם התפקיד הנבחר.
     */
    async getUsersByRole(roleName, includeInactiveGlobalUsers = false) {
        const foundRole = await DAL.findOne(RoleModel, { where: { role: roleName } });
        if (!foundRole) {
            console.log(`Error: Role '${roleName}' not found.`);
            return [];
        }

        const globalUserWhereClause = includeInactiveGlobalUsers ? {} : { is_active: true };

        const usersWithRole = await DAL.findAll(user, {
            where: globalUserWhereClause,
            include: [{
                model: RoleModel,
                as: 'roles',
                where: { id: foundRole.id },
                attributes: ['id', 'role'], // וודא ש-ID כלול
                through: {
                    model: user_role,
                    attributes: ['is_active']
                }
            }]
        });

        console.log(`--- Debugging getUsersByRole for role: ${roleName} ---`);
        console.log('Raw usersWithRole from DAL (before final filter):', JSON.stringify(usersWithRole, null, 2));

        const filteredUsers = usersWithRole.filter(userInstance => {
            const hasActiveSpecificRole = userInstance.roles.some(r =>
                r.id === foundRole.id && r.UserRole?.is_active // **התיקון כאן:** גישה ל-r.UserRole
            );
            return hasActiveSpecificRole;
        }).map(userInstance => {
            const roles = userInstance.roles.filter(r => r.UserRole?.is_active).map(r => r.role); // **התיקון כאן:** גישה ל-r.UserRole
            return { ...userInstance.dataValues, roles, is_active: userInstance.is_active };
        });

        console.log('Number of users found (after filter, before returning):', filteredUsers.length);
        console.log('First user in list (if exists):', filteredUsers[0] ? JSON.stringify(filteredUsers[0], null, 2) : 'No users');
        console.log('--- End Debugging getUsersByRole ---');
        return filteredUsers;
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
                    attributes: ['id', 'role'], // וודא ש-ID כלול
                    through: { attributes: ['is_active'] }
                }]
            });

            if (!foundUser) {
                return { succeeded: false, error: 'משתמש לא נמצא עבור רענון טוקן' };
            }

            if (!foundUser.is_active) {
                return { succeeded: false, error: 'החשבון שלך אינו פעיל. לא ניתן לרענן טוקן.' };
            }

            // 💡 שליפת תפקידים פעילים בלבד. גישה ל-UserRole (עם 'U' גדולה)
            const activeUserRoles = foundUser.roles
                ? foundUser.roles.filter(r => r.UserRole?.is_active).map(r => r.role) // **התיקון כאן:** גישה ל-r.UserRole
                : [];

            if (activeUserRoles.length === 0) {
                return { succeeded: false, error: 'אין לך תפקידים פעילים במערכת. לא ניתן לרענן טוקן.' };
            }

            const newAccessToken = jwt.sign(
                { id: foundUser.id, roles: activeUserRoles },
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
            return { succeeded: false, error: 'טוקן רענון לא חוקי או פג תוקף.' };
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