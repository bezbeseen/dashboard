-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "googleDriveFolderId" TEXT,
ADD COLUMN     "googleDriveLastError" TEXT,
ADD COLUMN     "googleDriveSyncedAt" TIMESTAMP(3);
