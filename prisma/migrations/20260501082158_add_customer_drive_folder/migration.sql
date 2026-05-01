-- CreateTable
CREATE TABLE "CustomerDriveFolder" (
    "id" TEXT NOT NULL,
    "quickbooksCompanyId" TEXT NOT NULL,
    "quickbooksCustomerId" TEXT NOT NULL,
    "googleDriveFolderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerDriveFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerDriveFolder_quickbooksCompanyId_quickbooksCustomerI_key" ON "CustomerDriveFolder"("quickbooksCompanyId", "quickbooksCustomerId");
