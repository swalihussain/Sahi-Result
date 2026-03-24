const { getDbConnection } = require('./src/lib/db');
(async () => {
  const db = await getDbConnection();
  const messages = await db.all('SELECT * FROM messages');
  console.log(JSON.stringify(messages, null, 2));
})();
