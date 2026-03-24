const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT * FROM messages", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(JSON.stringify(rows, null, 2));
  });
});
db.close();
