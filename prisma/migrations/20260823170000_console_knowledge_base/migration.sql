-- CreateTable
CREATE TABLE `KnowledgeProvider` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL DEFAULT '',
    `region` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeProvider_type_status_idx`(`type`, `status`),
    INDEX `KnowledgeProvider_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeAsset` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL DEFAULT '',
    `institutionId` VARCHAR(191) NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `contentText` LONGTEXT NOT NULL,
    `sourceUrl` VARCHAR(500) NULL,
    `fileName` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NULL,
    `originalPublishedAt` DATETIME(3) NULL,
    `originalUpdatedAt` DATETIME(3) NULL,
    `reviewerEmail` VARCHAR(191) NULL,
    `reviewMemo` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_REVIEW',
    `version` INTEGER NOT NULL DEFAULT 1,
    `publishedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeAsset_status_domain_idx`(`status`, `domain`),
    INDEX `KnowledgeAsset_providerId_idx`(`providerId`),
    INDEX `KnowledgeAsset_institutionId_status_idx`(`institutionId`, `status`),
    INDEX `KnowledgeAsset_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeAssetVersion` (
    `id` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `snapshot` LONGTEXT NOT NULL,
    `changedBy` VARCHAR(191) NOT NULL,
    `changeNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KnowledgeAssetVersion_assetId_createdAt_idx`(`assetId`, `createdAt`),
    UNIQUE INDEX `KnowledgeAssetVersion_assetId_version_key`(`assetId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpertOpinion` (
    `id` VARCHAR(191) NOT NULL,
    `expertName` VARCHAR(191) NOT NULL,
    `affiliation` VARCHAR(191) NOT NULL DEFAULT '',
    `domain` VARCHAR(191) NOT NULL DEFAULT '',
    `assetId` VARCHAR(191) NULL,
    `opinion` LONGTEXT NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied` BOOLEAN NOT NULL DEFAULT false,
    `internalMemo` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ExpertOpinion_domain_applied_idx`(`domain`, `applied`),
    INDEX `ExpertOpinion_assetId_idx`(`assetId`),
    INDEX `ExpertOpinion_receivedAt_idx`(`receivedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KnowledgeAsset` ADD CONSTRAINT `KnowledgeAsset_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `KnowledgeProvider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeAssetVersion` ADD CONSTRAINT `KnowledgeAssetVersion_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `KnowledgeAsset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpertOpinion` ADD CONSTRAINT `ExpertOpinion_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `KnowledgeAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
