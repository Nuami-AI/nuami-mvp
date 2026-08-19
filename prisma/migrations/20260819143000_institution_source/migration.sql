-- CreateTable
CREATE TABLE `InstitutionSource` (
    `id` VARCHAR(191) NOT NULL,
    `institutionId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'idle',
    `errorMessage` TEXT NULL,
    `documentId` VARCHAR(191) NULL,
    `lastFetchedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InstitutionSource_institutionId_url_key`(`institutionId`, `url`),
    INDEX `InstitutionSource_institutionId_status_idx`(`institutionId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InstitutionSource` ADD CONSTRAINT `InstitutionSource_institutionId_fkey` FOREIGN KEY (`institutionId`) REFERENCES `Institution`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InstitutionSource` ADD CONSTRAINT `InstitutionSource_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `InstitutionDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
