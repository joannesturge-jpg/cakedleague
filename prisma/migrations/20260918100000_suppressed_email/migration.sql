-- CreateTable
CREATE TABLE "SuppressedEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuppressedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuppressedEmail_email_key" ON "SuppressedEmail"("email");

-- Seed the five addresses that unsubscribed via Resend's audience tool.
INSERT INTO "SuppressedEmail" ("id", "email") VALUES
  ('seed_suppressed_1', 'aschottphoto@gmail.com'),
  ('seed_suppressed_2', 'elizthornton42@gmail.com'),
  ('seed_suppressed_3', 'lerowberry07@gmail.com'),
  ('seed_suppressed_4', 'malachma@gmail.com'),
  ('seed_suppressed_5', 'oliviajoanos@gmail.com')
ON CONFLICT ("email") DO NOTHING;
