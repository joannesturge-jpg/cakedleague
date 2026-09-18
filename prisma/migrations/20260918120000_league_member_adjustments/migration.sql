-- CreateTable
CREATE TABLE "LeagueMemberAdjustment" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "LeagueMemberAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeagueMemberAdjustment_memberId_idx" ON "LeagueMemberAdjustment"("memberId");

-- AddForeignKey
ALTER TABLE "LeagueMemberAdjustment" ADD CONSTRAINT "LeagueMemberAdjustment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
