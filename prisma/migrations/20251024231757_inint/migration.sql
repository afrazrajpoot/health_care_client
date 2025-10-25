-- CreateTable
CREATE TABLE "public"."CheckoutSession" (
    "id" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "physicianId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutSession_stripeSessionId_key" ON "public"."CheckoutSession"("stripeSessionId");

-- CreateIndex
CREATE INDEX "CheckoutSession_stripeSessionId_idx" ON "public"."CheckoutSession"("stripeSessionId");

-- CreateIndex
CREATE INDEX "CheckoutSession_physicianId_idx" ON "public"."CheckoutSession"("physicianId");
