-- PostgreSQL Initialization Script for CeramixFlow
-- Kích hoạt các extension hỗ trợ UUID và tối ưu truy vấn JSONB GIN Index

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Khởi tạo database nếu chưa tồn tại
-- CREATE DATABASE ceramixflow_db;

-- Cấp quyền
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Thông báo
SELECT 'CeramixFlow PostgreSQL initialized with UUID and JSONB index support' AS status;
