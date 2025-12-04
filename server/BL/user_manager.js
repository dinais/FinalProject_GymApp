// BL/user_manager.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const {
    findUserByIdNumberOrEmail,
    findUserByIdDetailed,
    findUserByEmailForLogin,
    createUser,
    updateUser,
    findRoleByName,
    findOrCreateUserRole,
    updateUserRoleStatus,
    countActiveUserRoles,
    findAllUsersWithRoles,
    findUsersByRole,
    upsertUserPassword,
    findAllUserRoles,
    updateUserGlobalStatus,
    fetchUsersByRole,
    getUsersByEmails
} = require('../DAL/user_dal');


const registerUser = async (userData) => {
    try {
        console.log('[UserManager] Attempting to register or update user:', userData.id_number);

        let newUser = null;
        let isExistingUserUpdated = false;

        const existingUser = await findUserByIdNumberOrEmail(userData.id_number, userData.email);

        if (existingUser) {
            console.log(`[UserManager] User ${existingUser.id_number} already exists. Updating details.`);
            await updateUser(existingUser.id, userData); 
            newUser = existingUser;
            isExistingUserUpdated = true;
        } else {
            console.log('[UserManager] Creating new user.');
            newUser = await createUser(userData); 
        }

        const roleObject = await findRoleByName(userData.roleName);
        if (!roleObject) {
            throw new Error(`תפקיד '${userData.roleName}' לא נמצא במערכת.`);
        }

        const [userRoleEntry, created] = await findOrCreateUserRole(newUser.id, roleObject.id, true); 

        if (!created && !userRoleEntry.is_active) {
            console.log(`[UserManager] Reactivating role '${userData.roleName}' for user ${newUser.id}.`);
            await updateUserRoleStatus(newUser.id, roleObject.id, true);
        } else if (created) {
            console.log(`[UserManager] Created new user-role link for user ${newUser.id} with role '${userData.roleName}'.`);
        } else {
            console.log(`[UserManager] User ${newUser.id} already has active role '${userData.roleName}'.`);
        }
        if (!newUser.is_active) {
            console.log(`[UserManager] Activating user ${newUser.id} globally as a new role was added/activated.`);
            await updateUserGlobalStatus(newUser.id, true); 
        }
        const finalUser = await findUserByIdDetailed(newUser.id, true); 
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
        const foundUser = await findUserByEmailForLogin(email); 

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
    const users = await findAllUsersWithRoles(includeInactive); 
    return users.map(userInstance => {
        const roles = userInstance.roles || [];
        const activeRoles = userInstance.is_active
            ? roles.filter(r => r.UserRole?.is_active).map(r => r.role)
            : [];
        return { ...userInstance.dataValues, roles: activeRoles, is_active: userInstance.is_active };
    });
};

const getUserById = async (id, includeInactive = false) => {
    const userInstance = await findUserByIdDetailed(id, true); 
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

const updateUserLogic = async (id, updateData) => { 
    const userInstance = await findUserByIdDetailed(id, true); 
    if (!userInstance) {
        return false;
    }

    if (updateData.password) {
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        await upsertUserPassword(id, hashedPassword); 
        delete updateData.password; 
    }

    if (updateData.roleName) {
        const roleToUpdate = await findRoleByName(updateData.roleName);
        if (!roleToUpdate) {
            throw new Error(`תפקיד '${updateData.roleName}' לא קיים`);
        }
        await findOrCreateUserRole(id, roleToUpdate.id, true);
        delete updateData.roleName; 
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'is_active')) {
        const newIsActiveStatus = updateData.is_active;
        const allUserRoleEntries = await findAllUserRoles(id); 
        for (const entry of allUserRoleEntries) {
            await updateUserRoleStatus(id, entry.role_id, newIsActiveStatus);
        }
    }

    const updated = await updateUser(id, updateData); 
    return updated;
};

const softDeleteUser = async (userId, roleName) => {
    try {
        console.log(`[UserManager] Attempting soft delete for user ${userId}, role: ${roleName}`);

        const existingUser = await findUserByIdDetailed(userId, true); 
        if (!existingUser) {
            console.warn(`[UserManager] User ${userId} not found.`);
            throw new Error('משתמש לא נמצא.');
        }

        if (!roleName) {
            console.warn(`[UserManager] roleName is undefined or null.`);
            throw new Error('שם התפקיד חסר עבור פעולת המחיקה הרכה.');
        }

        const roleToDeactivateObj = await findRoleByName(roleName); 
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
            return true; 
        }

        await updateUserRoleStatus(userId, roleToDeactivateObj.id, false);

        const remainingActiveRolesCount = await countActiveUserRoles(userId); 

        if (remainingActiveRolesCount === 0) {
            if (existingUser.is_active) {
                console.log(`[UserManager] User ${userId} has no active roles left. Deactivating user globally.`);
                await updateUserGlobalStatus(userId, false); 
            } else {
                console.log(`[UserManager] User ${userId} already inactive globally and has no active roles.`);
            }
        } else {
            if (!existingUser.is_active) {
                console.log(`[UserManager] User ${userId} still has active roles. Activating user globally.`);
                await updateUserGlobalStatus(userId, true); 
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
        const existingUser = await findUserByIdDetailed(userId, true); 

        if (!existingUser) {
            console.warn(`[activateUser Debug] - User ${userId} not found for activation.`);
            return false;
        }

        if (existingUser.is_active) {
            console.log(`[activateUser Debug] - User ${userId} is already active globally.`);
            return true;
        }

        await updateUserGlobalStatus(userId, true); 
        const allUserRoles = await findAllUserRoles(userId); 
        for (const ur of allUserRoles) {
            if (!ur.is_active) {
                await updateUserRoleStatus(userId, ur.role_id, true); 
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
const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const foundUser = await findUserByIdDetailed(decoded.id, true);
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

const handleInitialLoginOrPasswordSetup = async ({ email, password: enteredPassword }) => {
    try {
        console.log(`[UserManager] Starting handleInitialLoginOrPasswordSetup process for email: ${email}`);

        const foundUser = await findUserByEmailForLogin(email); 

        if (!foundUser) {
            console.log(`[UserManager] User with email ${email} not found.`);
            return {
                succeeded: false,
                error: 'משתמש עם אימייל זה אינו קיים במערכת.',
                data: null
            };
        }
        if (foundUser.password && foundUser.password.hash) { 
            return {
                succeeded: false,
                error: 'משתמש זה כבר רשום במערכת. אנא התחבר דרך מסך ההתחברות.',
                data: null
            };
        } else {
            console.log(`[UserManager] No password found for user ${foundUser.id}. Setting new password and logging in.`);

            const hashedPassword = await bcrypt.hash(enteredPassword, 10);
            await upsertUserPassword(foundUser.id, hashedPassword); 
            if (!foundUser.is_active) {
                await updateUserGlobalStatus(foundUser.id, true); 
                console.log(`[UserManager] User ${foundUser.id} activated globally after setting password.`);
            }
            const allUserRoles = await findAllUserRoles(foundUser.id);
            for (const ur of allUserRoles) {
                if (!ur.is_active) {
                    await updateUserRoleStatus(foundUser.id, ur.role_id, true); 
                    console.log(`[UserManager] Role ${ur.role_id} for user ${foundUser.id} activated.`);
                }
            }
            const userWithDetails = await findUserByIdDetailed(foundUser.id); 
            const activeUserRolesForToken = userWithDetails.roles
                ? userWithDetails.roles.filter(r => r.UserRole && r.UserRole.is_active).map(r => r.role)
                : [];

            const accessToken = jwt.sign(
                { id: userWithDetails.id, roles: activeUserRolesForToken }, 
                process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET, 
                { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' } 
            );

            const refreshToken = jwt.sign(
                { id: userWithDetails.id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' } 
            );

            return {
                succeeded: true,
                message: 'הסיסמה נקבעה והתחברת בהצלחה.',
                accessToken,
                refreshToken,
                user: {
                    id: userWithDetails.id,
                    first_name: userWithDetails.first_name,
                    last_name: userWithDetails.last_name,
                    email: userWithDetails.email,
                    phone: userWithDetails.phone,
                    roles: activeUserRolesForToken, 
                    street_name: userWithDetails.street_name,
                    house_number: userWithDetails.house_number,
                    apartment_number: userWithDetails.apartment_number,
                    city: userWithDetails.city,
                    zip_code: userWithDetails.zip_code,
                    country: userWithDetails.country,
                    id_number: userWithDetails.id_number,
                    is_active: userWithDetails.is_active
                }
            };
        }
    } catch (err) {
        console.error('🚨 Error in BL/user_manager.js handleInitialLoginOrPasswordSetup:', err);
        return {
            succeeded: false,
            error: err.message || 'שגיאה פנימית בשרת בעת הטיפול בכניסה/קביעת סיסמה.',
            data: null
        };
    }
};

const fetchUsersByRoleSimple = async (role) => {
  try {
    return await fetchUsersByRole(role);
  } catch (error) {
    console.error('Error in fetchUsersByRoleSimple:', error);
    throw error;
  }
};
const fetchUsersByEmails = async (emailList) => {
  if (!emailList || emailList.length === 0) return [];
  

  const users = await getUsersByEmails(emailList);
  return users;
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
    refreshAccessToken,
    handleInitialLoginOrPasswordSetup,
    fetchUsersByRoleSimple ,
    fetchUsersByEmails
};