const { User, Role, Password } = require('../../DB/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// פונקציות נפרדות
const UserManager = {
    async registerUser(userData) {
        const {
            first_name,
            last_name,
            address,
            phone,
            gmail,
            password,
            roleId
        } = userData;

        // בדוק אם התפקיד קיים
        const role = await Role.findByPk(roleId);
        if (!role) {
            throw new Error('תפקיד לא קיים');
        }

        // בדוק אם האימייל כבר בשימוש
        const existing = await User.findOne({ where: { gmail } });
        if (existing) {
            throw new Error('האימייל כבר קיים במערכת');
        }

        // הצפן סיסמה
        const hashedPassword = await bcrypt.hash(password, 10);

        // צור את המשתמש
        const newUser = await User.create({
            first_name,
            last_name,
            address,
            phone,
            gmail,
            password_hash: hashedPassword
        });

        // שייך תפקיד למשתמש
        await newUser.addRole(role); // assuming Many-to-Many with addRole auto-generated

        return {
            id: newUser.id,
            first_name: newUser.first_name,
            gmail: newUser.gmail,
            role: role.role
        };
    },

    async login({ gmail, password }) {
        try {
            const user = await User.findOne({
                where: { gmail },
                include: [
                    {
                        model: Role,
                        as: 'roles',
                        attributes: ['role']
                    },
                    {
                        model: Password,
                        as: 'password',
                        attributes: ['hash']
                    }
                ]
            });

            if (!user || !user.password || !user.password.hash) {
                return {
                    succeeded: false,
                    error: 'Invalid email or password',
                    data: null
                };
            }

            const isValid = await bcrypt.compare(password, user.password.hash);
            if (!isValid) {
                return {
                    succeeded: false,
                    error: 'Invalid email or password',
                    data: null
                };
            }

            const accessToken = jwt.sign(
                {
                    id: user.id,
                    roles: user.roles.map(r => r.role)
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                { id: user.id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );
            console.log('login success data:', {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    roles: user.roles.map(r => r.role)
                }
            });

            return {
                succeeded: true,
                error: '',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        first_name: user.first_name,
                        roles: user.roles.map(r => r.role)
                    }
                }
            };
        } catch (err) {
            console.error('Login failed:', err);
            return {
                succeeded: false,
                error: err.message || 'Login failed',
                data: null
            };
        }
    },
    async getAllUsers() {
        return await User.findAll({
            include: [{ model: Role, as: 'Roles', attributes: ['role'] }]
        });
    },

    async getUserById(id) {
        return await User.findByPk(id, {
            include: [{ model: Role, as: 'Roles', attributes: ['role'] }]
        });
    },

    async updateUser(id, data) {
        const [updated] = await User.update(data, { where: { id } });
        return updated > 0;
    },

    async deleteUser(id) {
        const deleted = await User.destroy({ where: { id } });
        return deleted > 0;
    }
};

module.exports = UserManager;
