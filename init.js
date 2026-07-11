const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'upveil.sqlite');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    stars      INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment    TEXT    NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contact_submissions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    phone      TEXT    NOT NULL,
    email      TEXT    NOT NULL,
    service    TEXT,
    message    TEXT,
    status     TEXT    NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
  CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_submissions(created_at);
`);

// Seed the three reviews that originally shipped hardcoded in the frontend,
// so the site has the same starting content it had before the backend existed.
const reviewCount = db.prepare('SELECT COUNT(*) AS c FROM reviews').get().c;
if (reviewCount === 0) {
  const insert = db.prepare(
    'INSERT INTO reviews (name, stars, comment) VALUES (?, ?, ?)'
  );
  const seed = db.transaction((rows) => {
    for (const row of rows) insert.run(row.name, row.stars, row.comment);
  });
  seed([
    {
      name: 'Arvind S.',
      stars: 5,
      comment:
        "Upveil redesigned our website and it completely changed how clients see us. Fast and professional.",
    },
    {
      name: 'Meena R.',
      stars: 5,
      comment:
        'Loved the logo concepts — they actually listened to what our brand stood for.',
    },
    {
      name: 'Dinesh K.',
      stars: 4,
      comment:
        'Great digital marketing support, saw a real increase in inquiries within a month.',
    },
  ]);
}

module.exports = db;
