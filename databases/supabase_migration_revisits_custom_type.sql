-- Migration: Add custom category support to revisits
-- Run this in your Supabase SQL editor

-- 1. Add 'custom' value to the type enum
ALTER TYPE revisit_type ADD VALUE IF NOT EXISTS 'custom';

-- 2. Add custom_type text column (stores the actual label when type = 'custom')
ALTER TABLE revisits
ADD COLUMN IF NOT EXISTS custom_type TEXT DEFAULT NULL;
