const { User, Role } = require('../../../DB/models');
const dal = require('../../DAL/dal');

// יצירת משתמש חדש (ללא תפקידים, כי הם כבר מוגדרים במערכת)
exports.registerUser = async (req, res) => {
  try {
    const { first_name, last_name, address, phone, gmail } = req.body;
    const newUser = await User.create({
      first_name,
      last_name,
      address,
      phone,
      gmail
    });
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// שליפת כל המשתמשים כולל תפקידים שלהם
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Role,
          as: 'Roles',
          attributes: ['role']
        }
      ]
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// שליפת משתמש לפי מזהה כולל תפקידים שלו
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Role,
          as: 'Roles',
          attributes: ['role']
        }
      ]
    });
    if (user) res.json(user);
    else res.status(404).json({ error: 'User not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// עדכון פרטי משתמש (לא כולל תפקידים)
exports.updateUser = async (req, res) => {
  try {
    const updated = await User.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated[0]) res.json({ message: 'User updated successfully' });
    else res.status(404).json({ error: 'User not found or no changes' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// מחיקת משתמש
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (deleted) res.json({ message: 'User deleted successfully' });
    else res.status(404).json({ error: 'User not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
