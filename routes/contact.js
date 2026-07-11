const express = require('express');
const prisma = require('../db/init');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(str, max) {
  return String(str).trim().slice(0, max);
}

// POST /api/contact
// Body: { name, phone, email, service, message }
// This is the "Client details" form on the site (#clientForm).
router.post('/', async (req, res) => {
  const { name, phone, email, service, message } = req.body || {};

  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'name, phone, and email are required.' });
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    const submission = await prisma.contactSubmission.create({
      data: {
        name: sanitize(name, 120),
        phone: sanitize(phone, 40),
        email: sanitize(email, 160),
        service: service ? sanitize(service, 80) : null,
        message: message ? sanitize(message, 4000) : null,
      },
    });

    res.status(201).json({
      id: submission.id,
      message: "Thanks! We've received your details and will be in touch soon.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit contact form.' });
  }
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
router.get('/', requireAdminKey, async (req, res) => {
  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
});

// PATCH /api/contact/:id  (admin only) — update lead status
router.patch('/:id', requireAdminKey, async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'contacted', 'closed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const submission = await prisma.contactSubmission.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });
    res.json({ id: submission.id, status: submission.status });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update submission.' });
  }
});

module.exports = router;
