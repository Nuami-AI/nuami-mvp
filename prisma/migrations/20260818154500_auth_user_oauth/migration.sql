-- AlterTable
ALTER TABLE `AuthUser` MODIFY `passwordHash` VARCHAR(255) NULL,
    ADD COLUMN `provider` VARCHAR(191) NULL,
    ADD COLUMN `providerAccountId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `AuthUser_provider_providerAccountId_key` ON `AuthUser`(`provider`, `providerAccountId`);
