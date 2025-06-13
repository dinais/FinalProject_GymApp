const { user, role, password } = require('../../DB/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// פונקציות נפרדות
const user_manager = {
    async registerUser(userData) {
        const {
            first_name,
            last_name,
            address,
            phone,
            email,
            password,
            roleId
        } = userData;

        // בדוק אם התפקיד קיים
        const role = await role.findByPk(roleId);
        if (!role) {
            throw new Error('תפקיד לא קיים');
        }

        // בדוק אם האימייל כבר בשימוש
        const existing = await user.findOne({ where: { email } });
        if (existing) {
            throw new Error('האימייל כבר קיים במערכת');
        }

        // הצפן סיסמה
        const hashedPassword = await bcrypt.hash(password, 10);

        // צור את המשתמש
        const newUser = await user.create({
            first_name,
            last_name,
            address,
            phone,
            email,
            password_hash: hashedPassword
        });

        // שייך תפקיד למשתמש
        await newUser.addRole(role); // assuming Many-to-Many with addRole auto-generated

        return {
            id: newUser.id,
            first_name: newUser.first_name,
            email: newUser.email,
            role: role.role
        };
    },

 async login({ email, password: enteredPassword }) {
    try {
        const foundUser = await user.findOne({
            where: { email },
            include: [
                {
                    model: role,
                    as: 'roles',
                    attributes: ['role']
                },
                {
                    model: password,
                    as: 'password', // חייב להתאים ל־as ב־association
                    attributes: ['hash']
                }
            ]
        });

        if (!foundUser || !foundUser.password || !foundUser.password.hash) {
            return {
                succeeded: false,
                error: 'Invalid email or password',
                data: null
            };
        }

        const isValid = await bcrypt.compare(enteredPassword, foundUser.password.hash);

        if (!isValid) {
            return {
                succeeded: false,
                error: 'Invalid email or password',
                data: null
            };
        }

        const accessToken = jwt.sign(
            {
                id: foundUser.id,
                roles: foundUser.roles.map(r => r.role)
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: foundUser.id },
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
                    id: foundUser.id,
                    first_name: foundUser.first_name,
                    roles: foundUser.roles.map(r => r.role)
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
}
,
    async getAllUsers() {
        return await user.findAll({
            include: [{ model: role, as: 'Roles', attributes: ['role'] }]
        });
    },

    async getUserById(id) {
        return await user.findByPk(id, {
            include: [{ model: role, as: 'Roles', attributes: ['role'] }]
        });
    },

    async updateUser(id, data) {
        const [updated] = await user.update(data, { where: { id } });
        return updated > 0;
    },

    async deleteUser(id) {
        const deleted = await user.destroy({ where: { id } });
        return deleted > 0;
    }
};

module.exports = user_manager;
