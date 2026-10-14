-- CreateTable
CREATE TABLE `LlmUsageEvent` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `task` VARCHAR(191) NOT NULL,
    `tokensIn` INTEGER NOT NULL DEFAULT 0,
    `tokensOut` INTEGER NOT NULL DEFAULT 0,
    `ok` BOOLEAN NOT NULL DEFAULT true,
    `error` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LlmUsageEvent_createdAt_idx`(`createdAt`),
    INDEX `LlmUsageEvent_provider_createdAt_idx`(`provider`, `createdAt`),
    INDEX `LlmUsageEvent_task_createdAt_idx`(`task`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
