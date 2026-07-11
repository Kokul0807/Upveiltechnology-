const express = require('express');
const db = require('../db/init');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(str, max) {
  return String(str).trim().slice(0, max);
}

// POST /api/contact
// Body: { name, phone, email, service, message }
// This is the "Client details" form on the site (#clientForm).
router.post('/', (req, res) => {
  const { name, phone, email, service, message } = req.body || {};

  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'name, phone, and email are required.' });
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  const info = db
    .prepare(
      `INSERT INTO contact_submissions (name, phone, email, service, message)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      sanitize(name, 120),
      sanitize(phone, 40),
      sanitize(email, 160),
      service ? sanitize(service, 80) : null,
      message ? sanitize(message, 4000) : null
    );

  res.status(201).json({
    id: info.lastInsertRowid,
    message: "Thanks! We've received your details and will be in touch soon.",
  });
});

// Simple shared-secret guard for the admin-facing list endpoint below.
// Set ADMIN_KEY in .env and send it as the `x-admin-key` header.
function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return res.status(503).json({ error: 'ADMIN_KEY is not configured on the server.' });
  }
  if (req.get('x-admin-key') !== expected) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

// GET /api/contact  (admin only)
// Lists submitted leads so the Upveil team can follow up on them.
router.get('/', requireAdminKey, (req, res) => {
  const submissions = db
    .prepare('SELECT * FROM contact_submissions ORDER BY created_at DESC')
    .all();
  res.json(submissions);
});

// PATCH /api/contact/:id  (admin only) — update lead status
router.patch('/:id', requireAdminKey, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'contacted', 'closed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  const result = db
    .prepare('UPDATE contact_submissions SET status = ? WHERE id = ?')
    .run(status, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Submission not found.' });
  }
  res.json({ id: Number(req.params.id), status });
});

module.exports = router;
