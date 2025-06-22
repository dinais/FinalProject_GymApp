// BL/user_manager.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// ייבוא סלקטיבי של כל פונקציה מה-DAL
const {
    findUserByIdNumberOrEmail,
    findUserByIdDetailed,
    findUserByEmailForLogin,
    createUser,
    updateUser, // זו פונקציה מה-DAL
    findRoleByName,
    findOrCreateUserRole,
    updateUserRoleStatus,
    countActiveUserRoles,
    findAllUsersWithRoles,
    findUsersByRole,
    getAllRoles, // זו פונקציה מה-DAL
    upsertUserPassword,
    findAllUserRoles,
    updateUserGlobalStatus
} = require('../DAL/user_dal');


const registerUser = async (userData) => {
    try {
        console.log('[UserManager] Attempting to register or update user:', userData.id_number);

        let newUser = null;
        let isExistingUserUpdated = false;

        const existingUser = await findUserByIdNumberOrEmail(userData.id_number, userData.email);

        if (existingUser) {
            console.log(`[UserManager] User ${existingUser.id_number} already exists. Updating details.`);
            await updateUser(existingUser.id, userData); // קריאה לפונקציית DAL
            newUser = existingUser;
            isExistingUserUpdated = true;
        } else {
            console.log('[UserManager] Creating new user.');
            newUser = await createUser(userData); // קריאה לפונקציית DAL
        }

        const roleObject = await findRoleByName(userData.roleName); // קריאה לפונקציית DAL
        if (!roleObject) {
            throw new Error(`תפקיד '${userData.roleName}' לא נמצא במערכת.`);
        }

        const [userRoleEntry, created] = await findOrCreateUserRole(newUser.id, roleObject.id, true); // קריאה לפונקציית DAL

        if (!created && !userRoleEntry.is_active) {
            console.log(`[UserManager] Reactivating role '${userData.roleName}' for user ${newUser.id}.`);
            await updateUserRoleStatus(newUser.id, roleObject.id, true); // קריאה לפונקציית DAL
        } else if (created) {
            console.log(`[UserManager] Created new user-role link for user ${newUser.id} with role '${userData.roleName}'.`);
        } else {
            console.log(`[UserManager] User ${newUser.id} already has active role '${userData.roleName}'.`);
        }

        // וודא שהמשתמש פעיל גלובלית אם התפקיד נוסף/הופעל מחדש
        if (!newUser.is_active) {
            console.log(`[UserManager] Activating user ${newUser.id} globally as a new role was added/activated.`);
            await updateUserGlobalStatus(newUser.id, true); // קריאה לפונקציית DAL
        }

        // שליפה סופית של המשתמש כולל כל התפקידים המעודכנים (פעילים ולא פעילים)
        // כדי להחזיר את האובייקט המלא ביותר.
        const finalUser = await findUserByIdDetailed(newUser.id, true); // קריאה לפונקציית DAL
        // יש צורך למפות את התפקידים הפעילים בלבד להחזרה ללקוח
        const activeRolesForFinalUser = finalUser.roles
            ? finalUser.roles.filter(r => r.UserRole?.is_active).map(r => r.role)
            : [];

        return {
            message: isExistingUserUpdated ? 'המשתמש עודכן בהצלחה.' : 'המשתמש נרשם בהצלחה.',
            user: { ...finalUser.dataValues, roles: activeRolesForFinalUser },
            isExistingUserUpdated
        };

    } catch (error) {
        console.error('🚨 Error in BL/user_manager.js registerUser:', error);
        throw error;
    }
};

const login = async ({ email, password: enteredPassword }) => {
    try {
        console.log('--- Starting login process for:', email, '---');
        const foundUser = await findUserByEmailForLogin(email); // קריאה לפונקציית DAL

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

        // שליפת תפקידים פעילים בלבד
        const activeUserRoles = foundUser.roles
            ? foundUser.roles.filter(r => r.UserRole && r.UserRole.is_active).map(r => r.role)
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
};

const getAllUsers = async (includeInactive = false) => {
    const users = await findAllUsersWithRoles(includeInactive); // קריאה לפונקציית DAL

    // מיפוי אובייקטי Sequelize לאובייקטים פשוטים וסינון תפקידים פעילים להחזרה
    return users.map(userInstance => {
        const roles = userInstance.roles || [];
        const activeRoles = userInstance.is_active
            ? roles.filter(r => r.UserRole?.is_active).map(r => r.role)
            : [];
        return { ...userInstance.dataValues, roles: activeRoles, is_active: userInstance.is_active };
    });
};

const getUserById = async (id, includeInactive = false) => {
    // נשלוף את כל התפקידים כדי שה-BL יוכל לטפל בלוגיקה של סינון תפקידים פעילים,
    // גם אם המשתמש לא פעיל גלובלית.
    const userInstance = await findUserByIdDetailed(id, true); // קריאה לפונקציית DAL

    if (!userInstance) {
        return null;
    }

    if (!includeInactive && !userInstance.is_active) {
        return null;
    }

    const roles = userInstance.roles || [];
    const activeRoles = userInstance.is_active
        ? roles.filter(r => r.UserRole?.is_active).map(r => r.role)
        : [];

    return { ...userInstance.dataValues, roles: activeRoles, is_active: userInstance.is_active };
};

const updateUserLogic = async (id, updateData) => { // שם פנימי, ייצוא בשם "updateUser"
    const userInstance = await findUserByIdDetailed(id, true); // קריאה לפונקציית DAL
    if (!userInstance) {
        return false;
    }

    if (updateData.password) {
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        await upsertUserPassword(id, hashedPassword); // קריאה לפונקציית DAL
        delete updateData.password; // חשוב למחוק כדי לא לנסות לעדכן בשדה לא קיים במודל user
    }

    if (updateData.roleName) {
        const roleToUpdate = await findRoleByName(updateData.roleName); // קריאה לפונקציית DAL
        if (!roleToUpdate) {
            throw new Error(`תפקיד '${updateData.roleName}' לא קיים`);
        }
        await findOrCreateUserRole(id, roleToUpdate.id, true); // קריאה לפונקציית DAL
        delete updateData.roleName; // חשוב למחוק
    }

    // טיפול בשינוי סטטוס is_active גלובלי של המשתמש והשפעתו על התפקידים
    if (Object.prototype.hasOwnProperty.call(updateData, 'is_active')) {
        const newIsActiveStatus = updateData.is_active;
        // נקבל את כל הקישורים בין המשתמש לתפקידים ונעדכן את כולם לסטטוס הגלובלי החדש
        const allUserRoleEntries = await findAllUserRoles(id); // קריאה לפונקציית DAL
        for (const entry of allUserRoleEntries) {
            await updateUserRoleStatus(id, entry.role_id, newIsActiveStatus); // קריאה לפונקציית DAL
        }
        // הסטטוס הגלובלי של המשתמש יעודכן יחד עם שאר הנתונים למטה
    }

    const updated = await updateUser(id, updateData); // קריאה לפונקציית DAL המיובאת
    return updated;
};

const softDeleteUser = async (userId, roleName) => {
    try {
        console.log(`[UserManager] Attempting soft delete for user ${userId}, role: ${roleName}`);

        const existingUser = await findUserByIdDetailed(userId, true); // קריאה לפונקציית DAL
        if (!existingUser) {
            console.warn(`[UserManager] User ${userId} not found.`);
            throw new Error('משתמש לא נמצא.');
        }

        if (!roleName) {
            console.warn(`[UserManager] roleName is undefined or null.`);
            throw new Error('שם התפקיד חסר עבור פעולת המחיקה הרכה.');
        }

        const roleToDeactivateObj = await findRoleByName(roleName); // קריאה לפונקציית DAL
        if (!roleToDeactivateObj) {
            console.warn(`[UserManager] Role '${roleName}' not found in roles table.`);
            throw new Error(`תפקיד '${roleName}' לא קיים במערכת.`);
        }

        const userRoleEntry = existingUser.roles.find(r =>
            r.id === roleToDeactivateObj.id && r.UserRole
        );

        if (!userRoleEntry) {
            console.warn(`[UserManager] User ${userId} does not have role '${roleName}'.`);
            return false;
        }

        if (!userRoleEntry.UserRole.is_active) {
            console.log(`[UserManager] Role '${roleName}' for user ${userId} is already inactive.`);
            return true; // כבר לא פעיל, אין צורך בשינוי
        }

        console.log(`[UserManager] Deactivating role '${roleName}' for user ${userId} in user_role table.`);
        await updateUserRoleStatus(userId, roleToDeactivateObj.id, false); // קריאה לפונקציית DAL

        const remainingActiveRolesCount = await countActiveUserRoles(userId); // קריאה לפונקציית DAL

        if (remainingActiveRolesCount === 0) {
            if (existingUser.is_active) {
                console.log(`[UserManager] User ${userId} has no active roles left. Deactivating user globally.`);
                await updateUserGlobalStatus(userId, false); // קריאה לפונקציית DAL
            } else {
                console.log(`[UserManager] User ${userId} already inactive globally and has no active roles.`);
            }
        } else {
            // אם עדיין יש תפקידים פעילים, וודא שהמשתמש פעיל גלובלית
            if (!existingUser.is_active) {
                console.log(`[UserManager] User ${userId} still has active roles. Activating user globally.`);
                await updateUserGlobalStatus(userId, true); // קריאה לפונקציית DAL
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
};

const activateUser = async (userId) => {
    try {
        console.log(`[activateUser Debug] - Attempting to activate user ${userId}.`);
        const existingUser = await findUserByIdDetailed(userId, true); // קריאה לפונקציית DAL

        if (!existingUser) {
            console.warn(`[activateUser Debug] - User ${userId} not found for activation.`);
            return false;
        }

        if (existingUser.is_active) {
            console.log(`[activateUser Debug] - User ${userId} is already active globally.`);
            return true;
        }

        await updateUserGlobalStatus(userId, true); // קריאה לפונקציית DAL
        console.log(`[activateUser Debug] - User ${userId} activated globally.`);

        // הפעל מחדש את כל הקישורים בטבלת user_role עבור משתמש זה
        const allUserRoles = await findAllUserRoles(userId); // קריאה לפונקציית DAL
        for (const ur of allUserRoles) {
            if (!ur.is_active) {
                await updateUserRoleStatus(userId, ur.role_id, true); // קריאה לפונקציית DAL
                console.log(`[activateUser Debug] - Role ${ur.role_id} for user ${userId} activated.`);
            }
        }
        console.log(`[activateUser Debug] - All roles for user ${userId} activated.`);
        return true;
    } catch (error) {
        console.error('🚨 Error in BL/user_manager.js activateUser:', error);
        throw error;
    }
};

const getUsersByRole = async (roleName, includeInactiveGlobalUsers = false) => {
    const usersWithRole = await findUsersByRole(roleName, includeInactiveGlobalUsers); // קריאה לפונקציית DAL

    console.log(`--- Debugging getUsersByRole for role: ${roleName} ---`);
    console.log('Raw usersWithRole from DAL (before final filter):', JSON.stringify(usersWithRole, null, 2));

    // מיפוי לאובייקטים פשוטים וסינון סופי של תפקידים פעילים להחזרה (אם findUsersByRole לא מסנן מספיק).
    // findUsersByRole כבר מסנן תפקידים לפי `is_active: true` ב-through,
    // אז פה רק נוודא שהנתונים מוחזרים בצורה הרצויה.
    const filteredUsers = usersWithRole.map(userInstance => {
        const roles = userInstance.roles.filter(r => r.UserRole?.is_active).map(r => r.role);
        return { ...userInstance.dataValues, roles, is_active: userInstance.is_active };
    });

    console.log('Number of users found (after filter, before returning):', filteredUsers.length);
    console.log('First user in list (if exists):', filteredUsers[0] ? JSON.stringify(filteredUsers[0], null, 2) : 'No users');
    console.log('--- End Debugging getUsersByRole ---');
    return filteredUsers;
};

const getAllRolesLogic = async () => { // שם פנימי, ייצוא בשם "getAllRoles"
    return await getAllRoles(); // קריאה לפונקציית DAL
};

const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const foundUser = await findUserByIdDetailed(decoded.id, true); // קריאה לפונקציית DAL
        if (!foundUser) {
            return { succeeded: false, error: 'משתמש לא נמצא עבור רענון טוקן' };
        }

        if (!foundUser.is_active) {
            return { succeeded: false, error: 'החשבון שלך אינו פעיל. לא ניתן לרענן טוקן.' };
        }

        const activeUserRoles = foundUser.roles
            ? foundUser.roles.filter(r => r.UserRole?.is_active).map(r => r.role)
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
};

const setPassword = async (userId, newPassword) => {
    const userToUpdate = await findUserByIdDetailed(userId, false); // קריאה לפונקציית DAL
    if (!userToUpdate) {
        throw new Error('משתמש לא נמצא');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const success = await upsertUserPassword(userId, hashedPassword); // קריאה לפונקציית DAL
    return success;
};

module.exports = {
    registerUser,
    login,
    getAllUsers,
    getUserById,
    updateUser: updateUserLogic, 
    softDeleteUser,
    activateUser,
    getUsersByRole,
    getAllRoles: getAllRolesLogic, 
    refreshAccessToken,
    setPassword
};