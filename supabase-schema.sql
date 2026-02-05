-- =============================================
-- Moodboards - DATABASE SCHEMA v2
-- =============================================
-- 
-- Instructions:
-- 1. Go to your Supabase dashboard
-- 2. Click "SQL Editor" in the sidebar
-- 3. Click "New Query"
-- 4. Paste this entire file
-- 5. Click "Run" (or press Ctrl+Enter)
--
-- =============================================

-- Enable UUID extension (required for auto-generated IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: boards
-- Stores moodboard metadata and password hashes
-- =============================================
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    deletion_password_hash TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_boards_name ON boards(name);

-- =============================================
-- TABLE: labels
-- Stores board-specific labels for grouping images
-- =============================================
CREATE TABLE IF NOT EXISTS labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#a78bfa',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(board_id, name)
);

-- Index for faster lookups by board
CREATE INDEX IF NOT EXISTS idx_labels_board_id ON labels(board_id);

-- =============================================
-- TABLE: images
-- Stores image references (actual images are on Google Drive)
-- =============================================
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    label_id UUID REFERENCES labels(id) ON DELETE SET NULL,
    drive_file_id TEXT NOT NULL,
    drive_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    comment TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by board
CREATE INDEX IF NOT EXISTS idx_images_board_id ON images(board_id);
CREATE INDEX IF NOT EXISTS idx_images_label_id ON images(label_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- These control who can read/write data
-- =============================================

-- Enable RLS on all tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- BOARDS POLICIES
-- ----------------

-- Anyone can read board names (for the dropdown list)
CREATE POLICY "Allow public read on boards" ON boards
    FOR SELECT USING (true);

-- Anyone can create new boards
CREATE POLICY "Allow public insert on boards" ON boards
    FOR INSERT WITH CHECK (true);

-- Anyone can delete boards
CREATE POLICY "Allow public delete on boards" ON boards
    FOR DELETE USING (true);

-- LABELS POLICIES
-- ----------------

-- Anyone can read labels
CREATE POLICY "Allow public read on labels" ON labels
    FOR SELECT USING (true);

-- Anyone can create labels
CREATE POLICY "Allow public insert on labels" ON labels
    FOR INSERT WITH CHECK (true);

-- Anyone can update labels
CREATE POLICY "Allow public update on labels" ON labels
    FOR UPDATE USING (true);

-- Anyone can delete labels
CREATE POLICY "Allow public delete on labels" ON labels
    FOR DELETE USING (true);

-- IMAGES POLICIES
-- ----------------

-- Anyone can read images
CREATE POLICY "Allow public read on images" ON images
    FOR SELECT USING (true);

-- Anyone can add images to a board
CREATE POLICY "Allow public insert on images" ON images
    FOR INSERT WITH CHECK (true);

-- Anyone can update images (for toggling checkbox, adding comments, labels)
CREATE POLICY "Allow public update on images" ON images
    FOR UPDATE USING (true);

-- Anyone can delete images
CREATE POLICY "Allow public delete on images" ON images
    FOR DELETE USING (true);

-- =============================================
-- DONE! Your database is ready to use.
-- =============================================
