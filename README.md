# Upveil Technology — Backend & Database

A small Node.js/Express API backed by SQLite that powers the two forms on the
Upveil Technology website:

- The **star-rating review form** (`#reviewForm`)
- The **"tell us about your project" contact form** (`#clientForm`)

Previously both forms only updated an in-memory JavaScript array in the
browser, so submissions vanished on refresh. This backend persists them to a
real database and exposes a small REST API for the frontend to call.

## 1. Setup

```bash
cd upveil-backend
npm install
cp .env.example .env    # then edit PORT / CORS_ORIGIN / ADMIN_KEY as needed
npm start                # or: npm run dev  (auto-restart with nodemon)
```

The server listens on `http://localhost:3001` by default. A SQLite file is
created automatically at `db/upveil.sqlite` the first time it runs, with the
tables below and the three reviews that used to be hardcoded in the page.

## 2. Database schema

**reviews**
| column     | type                        |
|------------|-----------------------------|
| id         | INTEGER PK, autoincrement   |
| name       | TEXT, required              |
| stars      | INTEGER 1–5, required       |
| comment    | TEXT, required              |
| created_at | DATETIME, default now       |

**contact_submissions**
| column     | type                                     |
|------------|-------------------------------------------|
| id         | INTEGER PK, autoincrement                  |
| name       | TEXT, required                             |
| phone      | TEXT, required                             |
| email      | TEXT, required                             |
| service    | TEXT, optional                             |
| message    | TEXT, optional                             |
| status     | TEXT: new / contacted / closed (default new)|
| created_at | DATETIME, default now                      |

## 3. API endpoints

| Method | Path               | Auth        | Purpose                                   |
|--------|--------------------|-------------|--------------------------------------------|
| GET    | `/api/health`      | none        | Health check                                |
| GET    | `/api/reviews`     | none        | List all reviews + average score            |
| POST   | `/api/reviews`     | none*       | Submit a new review                         |
| POST   | `/api/contact`     | none*       | Submit the project inquiry form             |
| GET    | `/api/contact`     | `x-admin-key` header | List all leads (for the Upveil team)|
| PATCH  | `/api/contact/:id` | `x-admin-key` header | Update a lead's status              |

\* Public write endpoints are rate-limited (30 requests / 15 min / IP) to
reduce spam.

### Example: submit a review
```bash
curl -X POST http://localhost:3001/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya N.","stars":5,"comment":"Great team to work with!"}'
```

### Example: submit the contact form
```bash
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul","phone":"+91 90000 00000","email":"rahul@example.com","service":"Website Design & Build","message":"Need a new site."}'
```

### Example: view leads as admin
```bash
curl http://localhost:3001/api/contact -H "x-admin-key: change-me"
```

## 4. Connecting the existing frontend

`index.html` has been updated to call this API instead of only editing an
in-memory array:

- On load, it fetches `GET /api/reviews` and renders the list + average.
- Submitting the review form calls `POST /api/reviews`, then re-renders.
- Submitting the contact form calls `POST /api/contact`.

By default the frontend expects the API at `http://localhost:3001/api`. If
you deploy the backend elsewhere, update the `API_BASE` constant near the
bottom of `index.html`.

## 5. Notes on going to production

- Set a strong, random `ADMIN_KEY` and don't commit `.env`.
- Put this behind HTTPS (e.g. a reverse proxy like Nginx, or a platform like
  Render/Railway/Fly.io) — the admin key is sent as a plain header.
- Swap SQLite for Postgres/MySQL if you expect concurrent write traffic at
  scale; the query layer is isolated in `db/init.js` and `routes/*.js` so
  that's a contained change.
- Add CAPTCHA or email verification if spam becomes an issue on the public
  forms.
