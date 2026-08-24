-- ====================================================================
-- CeramixFlow Database Schema (PostgreSQL / Supabase SQL Editor)
-- Dùng để dán trực tiếp vào Supabase SQL Editor nếu muốn tạo bảng nhanh
-- ====================================================================

-- 1. Bảng lưu trữ mẻ gốm (Batches)
CREATE TABLE IF NOT EXISTS "batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchCode" TEXT NOT NULL UNIQUE,
    "rawDescription" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "overallStatus" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStage" TEXT NOT NULL DEFAULT 'TAO_HINH_MOC',
    "deadlineDays" INTEGER,
    "technicalSpecs" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng lưu trạng thái từng công đoạn (Stage Logs)
CREATE TABLE IF NOT EXISTS "batch_stage_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "stageData" TEXT,
    CONSTRAINT "batch_stage_logs_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Bảng báo cáo sự cố QC (Incident Reports)
CREATE TABLE IF NOT EXISTS "incident_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "defectCount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'CRITICAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "incident_reports_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Bảng lưu nhật ký thông báo hệ thống & Telegram (System Logs)
CREATE TABLE IF NOT EXISTS "system_event_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
