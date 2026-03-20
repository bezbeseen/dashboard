-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quickbooksCompanyId" TEXT,
    "quickbooksCustomerId" TEXT,
    "quickbooksEstimateId" TEXT,
    "quickbooksInvoiceId" TEXT,
    "customerName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "estimateStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "invoiceStatus" TEXT NOT NULL DEFAULT 'NONE',
    "estimateAmountCents" INTEGER NOT NULL DEFAULT 0,
    "invoiceAmountCents" INTEGER NOT NULL DEFAULT 0,
    "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
    "estimateSentAt" DATETIME,
    "estimateAcceptedAt" DATETIME,
    "productionStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" DATETIME,
    "readyAt" DATETIME,
    "deliveredAt" DATETIME,
    "paidAt" DATETIME,
    "boardStatus" TEXT NOT NULL DEFAULT 'REQUESTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuickBooksWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerEventKey" TEXT NOT NULL,
    "realmId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "errorText" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_quickbooksEstimateId_key" ON "Job"("quickbooksEstimateId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_quickbooksInvoiceId_key" ON "Job"("quickbooksInvoiceId");

-- CreateIndex
CREATE INDEX "Job_boardStatus_idx" ON "Job"("boardStatus");

-- CreateIndex
CREATE INDEX "ActivityLog_jobId_createdAt_idx" ON "ActivityLog"("jobId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksWebhookEvent_providerEventKey_key" ON "QuickBooksWebhookEvent"("providerEventKey");
