require('dotenv').config(); // חשוב!

const sequelize = require('../DB/config');
require('../DB/models'); // 💥 כאן טוענים את כל המודלים והקשרים!

async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true }); // או force: true אם רוצים למחוק ולבנות מחדש
      console.log('✅ Models synced');
    }
  } catch (err) {
    console.error('❌ Failed to connect to the database:', err);
    process.exit(1);
  }
}

module.exports = initDatabase;
