# Vercel Deployment Setup Guide

## ⚠️ CRITICAL: This step must be completed first!

Your API will **NOT WORK** without a PostgreSQL database configured. Follow these steps:

---

## Step 1: Create Vercel Postgres Database

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)**
2. Select your **"Upveil Technology"** project
3. Click on **"Storage"** in the left sidebar
4. Click **"Create Database"** → **"Postgres"**
5. Choose a database name (e.g., "upveil-db")
6. Select your region (closest to your users)
7. Click **"Create"**

---

## Step 2: Copy the Connection String

1. After creation, you'll see your database details
2. Copy the **`DATABASE_URL`** connection string
   - It looks like: `postgresql://user:password@host:port/dbname`
3. **Keep this safe** - don't commit it to git

---

## Step 3: Add Environment Variables to Vercel

1. In your project, go to **Settings** → **Environment Variables**
2. Click **"Add New"** and fill in:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `DATABASE_URL` | Your connection string from Step 2 | **REQUIRED** |
   | `CORS_ORIGIN` | `https://upveiltechnology.com` | Optional, for security |
   | `ADMIN_KEY` | Your random secret string | Optional, for admin API |
   | `NODE_ENV` | `production` | Optional |

3. Click **"Save"** for each variable

---

## Step 4: Trigger a Redeploy

1. Go to **Deployments** tab
2. Click the **three dots** on the latest deployment
3. Select **"Redeploy"**

OR push a new commit to trigger auto-deploy:

```bash
git commit --allow-empty -m "Trigger redeploy with DATABASE_URL"
git push
```

---

## Step 5: Verify It Works

1. Visit `https://upveiltechnology.vercel.app/api/health`
2. You should see:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "timestamp": "2026-07-11T10:30:00.000Z"
   }
   ```

3. If you see `database: "disconnected"`, go back to Step 1-3

---

## Troubleshooting

### Error: `FUNCTION_INVOCATION_FAILED`
**Cause:** DATABASE_URL is not set or invalid
**Fix:** Follow Steps 1-3 above

### Error: "Connection refused"
**Cause:** Invalid connection string
**Fix:** Copy the DATABASE_URL again from your Vercel Storage dashboard

### Error: "P2002: Unique constraint failed"
**Cause:** Tables already exist
**Fix:** This is expected - your data is being preserved

---

## What Each Environment Variable Does

| Variable | Purpose | Example |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `CORS_ORIGIN` | Allowed frontend domains | `https://example.com` |
| `ADMIN_KEY` | Secret for admin endpoints | `super-secret-key-123` |
| `NODE_ENV` | Environment mode | `production` |

---

## API Endpoints

Once configured, your API is available at:

- `POST /api/reviews` - Submit a review
- `GET /api/reviews` - Get all reviews
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get submissions (admin only)
- `GET /api/health` - Health check

---

## Need Help?

If your deployment still fails:

1. Check Vercel **Deployments** → **Logs** tab
2. Look for error messages about `DATABASE_URL`
3. Verify your connection string doesn't have typos
4. Make sure your IP is whitelisted (usually automatic)
