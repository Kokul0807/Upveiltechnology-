const { PrismaClient } = require('@prisma/client');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please configure DATABASE_URL in your .env or Vercel environment variables.');
  process.exit(1);
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Test connection
prisma.$connect()
  .then(() => {
    console.log('✅ Successfully connected to PostgreSQL');
  })
  .catch((error) => {
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    console.error('Details:', error);
    process.exit(1);
  });

module.exports = prisma;
