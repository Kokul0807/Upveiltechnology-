const express = require('express');
const prisma = require('../db/init');

const router = express.Router();

function sanitize(str, max) {
  return String(str).trim().slice(0, max);
}

// GET /api/reviews
// Returns every review (newest first) plus the average score and count,
// matching what the original front-end computed client-side.
router.get('/', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const average = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
      : '0.0';

    res.json({ reviews, average, count: reviews.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// POST /api/reviews
// Body: { name, stars, comment }
router.post('/', async (req, res) => {
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

  try {
    const review = await prisma.review.create({
      data: {
        name: cleanName,
        stars: starsNum,
        comment: cleanComment,
      },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create review.' });
  }
});

module.exports = router;
