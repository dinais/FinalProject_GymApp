require('dotenv').config();
const initDatabase = require('./init_db');

initDatabase().then(() => {
    console.log('✅ initDatabase completed');
    process.exit(0);
}).catch((err) => {
    console.error('❌ initDatabase failed:', err);
    process.exit(1);
});
