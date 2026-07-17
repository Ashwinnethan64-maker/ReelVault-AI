import prisma from '../lib/prisma';
import { processReelMetadata } from "./aiProcessor.service";

export const enqueueJob = async (type: 'generate_metadata' | 'generate_embedding', payload: any) => {
  return await prisma.jobQueue.create({
    data: {
      type,
      payload: JSON.stringify(payload),
    }
  });
};

export const processNextJob = async () => {
  const job = await prisma.jobQueue.findFirst({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' }
  });

  if (!job) return null;

  await prisma.jobQueue.update({
    where: { id: job.id },
    data: { status: 'processing', attempts: job.attempts + 1 }
  });

  try {
    const payload = JSON.parse(job.payload);
    
    if (job.type === 'generate_metadata') {
      await processReelMetadata(payload.reelId, payload.content);
    }
    
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: 'completed' }
    });
    
    return true;
  } catch (error: any) {
    console.error(`Job ${job.id} failed:`, error);
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { 
        status: job.attempts >= 3 ? 'failed' : 'pending', 
        error: error.message 
      }
    });
    return false;
  }
};

export const startBackgroundWorker = () => {
  console.log("Starting background job worker...");
  setInterval(async () => {
    await processNextJob();
  }, 5000);
};
