// DAL/user_dal.js
const { user, role: RoleModel, password: PasswordModel, user_role } = require('../../DB/models');
const { Op } = require('sequelize');
// DAL/user_dal.js
module.exports.fetchUsersByRole = async (roleName) => {
  try {
    console.log("Fetching users with role (DAL):", roleName);

    const users = await user.findAll({
      include: [{
        model: RoleModel,
        as: 'roles',
        where: { role: roleName },
        through: { where: { is_active: true } },
        required: true
      }],
      attributes: ['id', 'first_name', 'last_name', 'email']
    });

    console.log(`Found ${users.length} users with role ${roleName}`);
    return users;
  } catch (error) {
    console.error("Error in fetchUsersByRoleSimple:", error);
    throw error; // מעביר את השגיאה הלאה כדי שה-controller ידע לטפל בה
  }
};

module.exports.findUserByIdNumberOrEmail = async (idNumber, email) => {
    return await user.findOne({
        where: {
            [Op.or]: [
                { id_number: idNumber },
                { email: email }
            ]
        },
        include: [{
            model: RoleModel,
            as: 'roles',
            attributes: ['id', 'role'],
            through: { attributes: ['is_active'] }
        }]
    });
};

module.exports.findUserByIdDetailed = async (userId, includeAllRoles = false) => {
    const includeOptions = {
        model: RoleModel,
        as: 'roles',
        attributes: ['id', 'role'],
        through: { attributes: ['is_active'] }
    };

    if (!includeAllRoles) {
        includeOptions.through.where = { is_active: true }; // רק תפקידים פעילים בקישור
    }

    return await user.findByPk(userId, {
        include: [
            includeOptions,
            {
                model: PasswordModel,
                as: 'password',
                attributes: ['hash']
            }
        ]
    });
};

module.exports.findUserByEmailForLogin = async (email) => {
    return await user.findOne({
        where: { email },
        include: [
            {
                model: RoleModel,
                as: 'roles',
                attributes: ['id', 'role'],
                through: { attributes: ['is_active'] }
            },
            {
                model: PasswordModel,
                as: 'password',
                attributes: ['hash']
            }
        ]
    });
};

module.exports.createUser = async (userData) => {
    return await user.create(userData);
};

module.exports.updateUser = async (userId, updateData) => {
    const [updatedCount] = await user.update(updateData, { where: { id: userId } });
    return updatedCount > 0;
};

module.exports.findRoleByName = async (roleName) => {
    return await RoleModel.findOne({ where: { role: roleName } });
};

module.exports.findOrCreateUserRole = async (userId, roleId, isActive = true) => {
    return await user_role.findOrCreate({
        where: { user_id: userId, role_id: roleId },
        defaults: { is_active: isActive }
    });
};

module.exports.updateUserRoleStatus = async (userId, roleId, isActive) => {
    const [updatedCount] = await user_role.update(
        { is_active: isActive },
        { where: { user_id: userId, role_id: roleId } }
    );
    return updatedCount > 0;
};

module.exports.countActiveUserRoles = async (userId) => {
    return await user_role.count({
        where: {
            user_id: userId,
            is_active: true
        }
    });
};

module.exports.findAllUsersWithRoles = async (includeInactiveGlobalUsers = false) => {
    const whereClause = includeInactiveGlobalUsers ? {} : { is_active: true };
    return await user.findAll({
        where: whereClause,
        include: [{
            model: RoleModel,
            as: 'roles',
            attributes: ['id', 'role'],
            through: { attributes: ['is_active'] }
        }]
    });
};

module.exports.findUsersByRole = async (roleName, includeInactiveGlobalUsers = false) => {
    const foundRole = await RoleModel.findOne({ where: { role: roleName } });
    if (!foundRole) {
        return [];
    }

    const globalUserWhereClause = includeInactiveGlobalUsers ? {} : { is_active: true };

    return await user.findAll({
        where: globalUserWhereClause,
        include: [{
            model: RoleModel,
            as: 'roles',
            where: { id: foundRole.id },
            attributes: ['id', 'role'],
            through: {
                model: user_role,
                attributes: ['is_active'],
                where: { is_active: true } // חשוב: סינון עבור קישורים פעילים בלבד לתפקיד הספציפי
            }
        }]
    });
};

module.exports.getAllRoles = async () => {
    return await RoleModel.findAll();
};

module.exports.upsertUserPassword = async (userId, hashedPassword) => {
    const [passwordInstance, created] = await PasswordModel.findOrCreate({
        where: { user_id: userId },
        defaults: { hash: hashedPassword }
    });
    if (!created) {
        await passwordInstance.update({ hash: hashedPassword });
    }
    return true;
};

module.exports.findAllUserRoles = async (userId) => {
    return await user_role.findAll({ where: { user_id: userId } });
};

module.exports.updateUserGlobalStatus = async (userId, isActive) => {
    const [updatedCount] = await user.update({ is_active: isActive }, { where: { id: userId } });
    return updatedCount > 0;
};

module.exports.getUsersByEmails = async (emailList) => {
  // החיפוש ב-SQL לפי רשימת האימיילים
  return await user.findAll({
    where: {
      email: emailList
    }
  });
};