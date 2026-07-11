const express = require('express');
const db = require('../db/init');

const router = express.Router();

function sanitize(str, max) {
  return String(str).trim().slice(0, max);
}

// GET /api/reviews
// Returns every review (newest first) plus the average score and count,
// matching what the original front-end computed client-side.
router.get('/', (req, res) => {
  const reviews = db
    .prepare('SELECT id, name, stars, comment, created_at FROM reviews ORDER BY created_at DESC')
    .all();

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
    : '0.0';

  res.json({ reviews, average, count: reviews.length });
});

// POST /api/reviews
// Body: { name, stars, comment }
router.post('/', (req, res) => {
  const { name, stars, comment } = req.body || {};

  if (!name || !comment || stars === undefined || stars === null) {
    return res.status(400).json({ error: 'name, stars, and comment are all required.' });
  }

  const starsNum = Number(stars);
  if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
    return res.status(400).json({ error: 'stars must be a whole number between 1 and 5.' });
  }

  const cleanName = sanitize(name, 120);
  const cleanComment = sanitize(comment, 2000);
  if (!cleanName || !cleanComment) {
    return res.status(400).json({ error: 'name and comment cannot be empty.' });
  }

  const info = db
    .prepare('INSERT INTO reviews (name, stars, comment) VALUES (?, ?, ?)')
    .run(cleanName, starsNum, cleanComment);

  const review = db
    .prepare('SELECT id, name, stars, comment, created_at FROM reviews WHERE id = ?')
    .get(info.lastInsertRowid);

  res.status(201).json(review);
});

module.exports = router;
