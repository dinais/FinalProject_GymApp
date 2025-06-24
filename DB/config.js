require('dotenv').config({ path: __dirname + '/../server/.env' });
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
        logging: console.log,
    }
);

module.exports = sequelize;

