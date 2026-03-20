-- CreateTable
CREATE TABLE "QuickBooksToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "realmId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" DATETIME NOT NULL,
    "refreshTokenExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "QuickBooksToken_realmId_key" ON "QuickBooksToken"("realmId");
