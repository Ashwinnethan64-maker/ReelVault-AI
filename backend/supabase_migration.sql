-- 1. Ensure the vector extension exists for the embedding column
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add columns to existing Reel table safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Reel' AND column_name='deletedAt') THEN
        ALTER TABLE "Reel" ADD COLUMN "deletedAt" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Reel' AND column_name='embedding') THEN
        ALTER TABLE "Reel" ADD COLUMN "embedding" vector(1536);
    END IF;
END $$;

-- 3. Create missing tables robustly
CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT,
    "reelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "autoTagging" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalReels" INTEGER NOT NULL DEFAULT 0,
    "totalWatchTime" INTEGER NOT NULL DEFAULT 0,
    "aiTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PromptLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "promptName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "JobQueue" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- 4. Create missing indexes robustly
CREATE UNIQUE INDEX IF NOT EXISTS "Settings_userId_key" ON "Settings"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Analytics_userId_key" ON "Analytics"("userId");
CREATE INDEX IF NOT EXISTS "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Reel_userId_createdAt_idx" ON "Reel"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Reel_categoryId_idx" ON "Reel"("categoryId");
CREATE INDEX IF NOT EXISTS "Reel_isFavorite_idx" ON "Reel"("isFavorite");
CREATE INDEX IF NOT EXISTS "Reel_isWatchLater_idx" ON "Reel"("isWatchLater");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");
CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt" ASC);

-- 5. Safely apply Foreign Key Constraints using DROP IF EXISTS
DO $$
BEGIN
    -- Activity
    ALTER TABLE "Activity" DROP CONSTRAINT IF EXISTS "Activity_userId_fkey";
    ALTER TABLE "Activity" DROP CONSTRAINT IF EXISTS "Activity_reelId_fkey";
    ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "Activity" ADD CONSTRAINT "Activity_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    -- Notification
    ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

    -- Settings
    ALTER TABLE "Settings" DROP CONSTRAINT IF EXISTS "Settings_userId_fkey";
    ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    -- Analytics
    ALTER TABLE "Analytics" DROP CONSTRAINT IF EXISTS "Analytics_userId_fkey";
    ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    -- Note
    ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_reelId_fkey";
    ALTER TABLE "Note" ADD CONSTRAINT "Note_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    -- ReelCollection
    ALTER TABLE "ReelCollection" DROP CONSTRAINT IF EXISTS "ReelCollection_collectionId_fkey";
    ALTER TABLE "ReelCollection" DROP CONSTRAINT IF EXISTS "ReelCollection_reelId_fkey";
    ALTER TABLE "ReelCollection" ADD CONSTRAINT "ReelCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "ReelCollection" ADD CONSTRAINT "ReelCollection_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    -- ReelTag
    ALTER TABLE "ReelTag" DROP CONSTRAINT IF EXISTS "ReelTag_reelId_fkey";
    ALTER TABLE "ReelTag" DROP CONSTRAINT IF EXISTS "ReelTag_tagId_fkey";
    ALTER TABLE "ReelTag" ADD CONSTRAINT "ReelTag_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "ReelTag" ADD CONSTRAINT "ReelTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    -- ChatMessage
    ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_sessionId_fkey";
    ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping some constraint updates: %', SQLERRM;
END $$;
