const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Check if reviews already exist
  const reviewCount = await prisma.review.count();
  
  if (reviewCount === 0) {
    await prisma.review.createMany({
      data: [
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
      ],
    });
    console.log('✅ Seeded 3 reviews');
  } else {
    console.log('📊 Reviews already exist, skipping seed');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
