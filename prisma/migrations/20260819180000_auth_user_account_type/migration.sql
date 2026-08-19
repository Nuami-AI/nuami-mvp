-- AlterTable
ALTER TABLE `AuthUser` ADD COLUMN `accountType` VARCHAR(191) NOT NULL DEFAULT 'END_USER';

-- CreateIndex
CREATE INDEX `AuthUser_accountType_idx` ON `AuthUser`(`accountType`);
