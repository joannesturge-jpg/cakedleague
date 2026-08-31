-- AlterTable
ALTER TABLE "User" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "NotifySignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "NotifySignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotifySignup_email_templateId_key" ON "NotifySignup"("email", "templateId");

-- CreateIndex
CREATE INDEX "NotifySignup_templateId_idx" ON "NotifySignup"("templateId");

-- AddForeignKey
ALTER TABLE "NotifySignup" ADD CONSTRAINT "NotifySignup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LeagueTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
