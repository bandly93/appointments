-- AlterTable
ALTER TABLE "DocumentRequest" ADD COLUMN     "fileMimeType" TEXT,
ADD COLUMN     "fileOriginalName" TEXT,
ADD COLUMN     "fileSizeBytes" INTEGER,
ADD COLUMN     "fileStorageKey" TEXT,
ADD COLUMN     "fileUploadedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequest_fileStorageKey_key" ON "DocumentRequest"("fileStorageKey");
