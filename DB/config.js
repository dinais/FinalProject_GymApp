require('dotenv').config(); 
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,     
    process.env.DB_USER,   
    process.env.DB_PASS,     
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',     
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        logging: false, // לראות שאילתות במסך
    }
);

module.exports = sequelize;

