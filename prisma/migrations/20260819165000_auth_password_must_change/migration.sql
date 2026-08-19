-- AlterTable
ALTER TABLE `AuthUser` ADD COLUMN `passwordMustChange` BOOLEAN NOT NULL DEFAULT false;
