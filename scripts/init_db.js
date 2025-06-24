require('dotenv').config();

const sequelize = require('../config/db');
require('../DB/models');

async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('✅ Models synced');
        }
    } catch (err) {
        console.error('❌ Failed to connect to the database:', err);
        process.exit(1);
    }
}

module.exports = initDatabase;
