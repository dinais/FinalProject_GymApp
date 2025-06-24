require('dotenv').config(); // חשוב לטעון את .env
const initDatabase = require('./init_db'); // הנתיב אל הקובץ ששלחת

initDatabase().then(() => {
  console.log('✅ initDatabase completed');
  process.exit(0);
}).catch((err) => {
  console.error('❌ initDatabase failed:', err);
  process.exit(1);
});
