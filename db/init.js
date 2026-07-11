const { PrismaClient } = require('@prisma/client');

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL ERROR: DATABASE_URL environment variable is not set!');
  console.error('');
  console.error('To fix this:');
  console.error('1. Go to Vercel Dashboard → Your Project');
  console.error('2. Click "Storage" → Create Postgres Database');
  console.error('3. Copy the DATABASE_URL connection string');
  console.error('4. Go to Settings → Environment Variables');
  console.error('5. Add DATABASE_URL = [your connection string]');
  console.error('6. Redeploy');
  console.error('');
  console.error('Without this, the API will not work.');
  process.exit(1);
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn'] 
    : ['error'],
});

// Test connection immediately
prisma.$connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL');
  })
  .catch((error) => {
    console.error('❌ Failed to connect to PostgreSQL:');
    console.error('Error:', error.message);
    console.error('');
    console.error('Check that:');
    console.error('1. DATABASE_URL is correctly set in environment variables');
    console.error('2. The connection string is valid');
    console.error('3. Your IP is allowed in the database firewall');
    process.exit(1);
  });

module.exports = prisma;
