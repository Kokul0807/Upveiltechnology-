# Upveil Technology — Backend & Database

A Node.js/Express API backed by **PostgreSQL** (via Prisma ORM) that powers the two forms on the Upveil Technology website:

- The **star-rating review form** (`#reviewForm`)
- The **"tell us about your project" contact form** (`#clientForm`)

Previously both forms only updated an in-memory JavaScript array in the browser, so submissions vanished on refresh. This backend persists them to a real database and exposes a small REST API for the frontend to call.

## 1. Setup (Local Development)

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+ running locally, OR a PostgreSQL connection string (e.g., from [Vercel Postgres](https://vercel.com/postgres))

### Install & Configure

```bash
cd upveil-backend
npm install
cp .env.example .env    # then edit DATABASE_URL / CORS_ORIGIN / ADMIN_KEY as needed
```

### Create the database and tables

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates tables)
npm run prisma:migrate

# Seed initial reviews
npm run prisma:seed

# Start the server
npm start                # or: npm run dev  (auto-restart with nodemon)
```

The server listens on `http://localhost:3001` by default.

## 2. Database schema (Prisma)

**reviews**
| field     | type                  | notes                    |
|-----------|-----------------------|--------------------------|
| id        | Int, autoincrement    | Primary key              |
| name      | String                | Required                 |
| stars     | Int                   | 1–5, required            |
| comment   | Text                  | Required                 |
| createdAt | DateTime              | Auto-set to now()        |

**contact_submissions**
| field     | type                  | notes                                    |
|-----------|-----------------------|------------------------------------------|
| id        | Int, autoincrement    | Primary key                              |
| name      | String                | Required                                 |
| phone     | String                | Required                                 |
| email     | String                | Required                                 |
| service   | String?               | Optional                                 |
| message   | Text?                 | Optional                                 |
| status    | String                | 'new' / 'contacted' / 'closed' (default) |
| createdAt | DateTime              | Auto-set to now()                        |

## 3. API endpoints

| Method | Path               | Auth        | Purpose                                   |
|--------|--------------------|-------------|--------------------------------------------|
| GET    | `/api/health`      | none        | Health check                                |
| GET    | `/api/reviews`     | none        | List all reviews + average score            |
| POST   | `/api/reviews`     | none*       | Submit a new review                         |
| POST   | `/api/contact`     | none*       | Submit the project inquiry form             |
| GET    | `/api/contact`     | `x-admin-key` header | List all leads (for the Upveil team)|
| PATCH  | `/api/contact/:id` | `x-admin-key` header | Update a lead's status              |

\* Public write endpoints are rate-limited (30 requests / 15 min / IP) to reduce spam.

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

`index.html` has been updated to call this API instead of only editing an in-memory array:

- On load, it fetches `GET /api/reviews` and renders the list + average.
- Submitting the review form calls `POST /api/reviews`, then re-renders.
- Submitting the contact form calls `POST /api/contact`.

By default the frontend expects the API at `http://localhost:3001/api`. If you deploy the backend elsewhere, update the `API_BASE` constant near the bottom of `index.html`.

## 5. Deployment on Vercel

### Step 1: Set up Vercel Postgres

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **Upveil Technology** project
3. Go to **Settings → Storage**
4. Click **Create Database → Postgres**
5. Accept the defaults and create
6. Copy the `DATABASE_URL` connection string

### Step 2: Add environment variables to Vercel

In your Vercel project settings (**Settings → Environment Variables**), add:

```
DATABASE_URL=postgresql://...  (copied from step 1)
CORS_ORIGIN=https://upveiltechnology.com,https://www.upveiltechnology.com
ADMIN_KEY=your-random-secret-key
```

### Step 3: Deploy migrations

Before your first deployment, run migrations against the Vercel Postgres database from your local machine:

```bash
# Set your DATABASE_URL to the Vercel Postgres connection string
export DATABASE_URL="postgresql://..."

# Run migrations
npm run prisma:migrate

# Seed initial reviews
npm run prisma:seed
```

Alternatively, add a `postbuild` script in `package.json` to auto-run on deploy:

```json
"scripts": {
  "build": "prisma generate",
  "postbuild": "prisma migrate deploy && node prisma/seed.js"
}
```

### Step 4: Deploy

Push to your main branch and Vercel will auto-deploy. The API will now work with Vercel Postgres!

## 6. Notes on going to production

- Set a strong, random `ADMIN_KEY` in your `.env` and in Vercel environment variables.
- Ensure `CORS_ORIGIN` includes only your production domain (not `*`).
- Use HTTPS in production (Vercel provides this by default).
- Add CAPTCHA or email verification if spam becomes an issue on the public forms.
- Monitor database usage in the Vercel dashboard.

## 7. Troubleshooting

### "FUNCTION_INVOCATION_FAILED" on Vercel
**Cause:** Connection string or database not set up.
**Fix:** Verify `DATABASE_URL` is set in Vercel environment variables and migrations have run.

### Migrations fail locally
Make sure PostgreSQL is running and the `DATABASE_URL` is correct.

### Prisma Studio (visual database editor)
```bash
npx prisma studio
```
Opens a browser UI at `http://localhost:5555` to view and edit your database.
