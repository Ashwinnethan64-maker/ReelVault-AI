import prisma from './src/lib/prisma';

async function main() {
  try {
    await prisma.$executeRawUnsafe('UPDATE "Reel" SET embedding = NULL;');
    await prisma.$executeRawUnsafe('ALTER TABLE "Reel" ALTER COLUMN embedding TYPE vector(768);');
    console.log('Fixed Reel vector column');
  } catch (err) {
    console.error('Reel fix failed:', err);
  }

  try {
    await prisma.$executeRawUnsafe('UPDATE "GraphNode" SET embedding = NULL;');
    await prisma.$executeRawUnsafe('ALTER TABLE "GraphNode" ALTER COLUMN embedding TYPE vector(768);');
    console.log('Fixed GraphNode vector column');
  } catch (err) {
    console.error('GraphNode fix failed:', err);
  }
}

main().finally(() => prisma.$disconnect());
