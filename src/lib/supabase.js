import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============ BOARD OPERATIONS ============

// Get all boards (names only, for dropdown)
export async function getAllBoards() {
    const { data, error } = await supabase
        .from('boards')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

// Get single board by name
export async function getBoardByName(name) {
    const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('name', name)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
}

// Create a new board with viewing and deletion passwords
export async function createBoard(name, password, deletionPassword) {
    const passwordHash = await hashPassword(password);
    const deletionPasswordHash = await hashPassword(deletionPassword);

    const { data, error } = await supabase
        .from('boards')
        .insert([{
            name,
            password_hash: passwordHash,
            deletion_password_hash: deletionPasswordHash
        }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            throw new Error('A board with this name already exists');
        }
        throw error;
    }
    return data;
}

// Verify board password
export async function verifyBoardPassword(name, password) {
    const board = await getBoardByName(name);
    if (!board) return { success: false, error: 'Board not found' };

    const passwordHash = await hashPassword(password);
    if (board.password_hash === passwordHash) {
        return { success: true, board };
    }
    return { success: false, error: 'Incorrect password' };
}

// Verify deletion password for a board
export async function verifyDeletionPassword(boardId, deletionPassword) {
    const { data: board, error } = await supabase
        .from('boards')
        .select('deletion_password_hash')
        .eq('id', boardId)
        .single();

    if (error || !board) return { success: false, error: 'Board not found' };

    const deletionPasswordHash = await hashPassword(deletionPassword);
    if (board.deletion_password_hash === deletionPasswordHash) {
        return { success: true };
    }
    return { success: false, error: 'Incorrect deletion password' };
}

// Delete a board and all its images
export async function deleteBoard(boardId) {
    // Labels and images will cascade delete
    const { error } = await supabase.from('boards').delete().eq('id', boardId);
    if (error) throw error;
    return true;
}

// Update board note
export async function updateBoardNote(boardId, note) {
    const { data, error } = await supabase
        .from('boards')
        .update({ note })
        .eq('id', boardId)
        .select();
    
    if (error) throw error;
    return data?.[0] || null;
}

// ============ LABEL OPERATIONS ============

// Default label colors
export const LABEL_COLORS = [
    '#a78bfa', // Violet (default)
    '#f87171', // Red
    '#fbbf24', // Amber
    '#34d399', // Emerald
    '#60a5fa', // Blue
    '#f472b6', // Pink
    '#a3e635', // Lime
    '#22d3ee', // Cyan
];

// Get all labels for a board
export async function getBoardLabels(boardId) {
    const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}

// Create a new label
export async function createLabel(boardId, name, color = '#a78bfa') {
    const { data, error } = await supabase
        .from('labels')
        .insert([{ board_id: boardId, name, color }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('A label with this name already exists in this board');
        }
        throw error;
    }
    return data;
}

// Update a label
export async function updateLabel(labelId, name, color) {
    const { data, error } = await supabase
        .from('labels')
        .update({ name, color })
        .eq('id', labelId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a label
export async function deleteLabel(labelId) {
    const { error } = await supabase
        .from('labels')
        .delete()
        .eq('id', labelId);

    if (error) throw error;
    return true;
}

// ============ IMAGE OPERATIONS ============

// Get all images for a board (with optional label info)
export async function getBoardImages(boardId) {
    const { data, error } = await supabase
        .from('images')
        .select(`
      *,
      label:labels(id, name, color)
    `)
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

// Add a new image reference
export async function addImage(boardId, driveFileId, driveUrl, filename, labelId = null) {
    const { data, error } = await supabase
        .from('images')
        .insert([{
            board_id: boardId,
            drive_file_id: driveFileId,
            drive_url: driveUrl,
            filename: filename,
            label_id: labelId,
            is_selected: false,
            comment: null
        }])
        .select(`
      *,
      label:labels(id, name, color)
    `)
        .single();

    if (error) throw error;
    return data;
}

// Add multiple images at once
export async function addMultipleImages(boardId, images, labelId = null) {
    const records = images.map(img => ({
        board_id: boardId,
        drive_file_id: img.driveFileId,
        drive_url: img.driveUrl,
        filename: img.filename,
        label_id: labelId,
        is_selected: false,
        comment: null
    }));

    const { data, error } = await supabase
        .from('images')
        .insert(records)
        .select(`
      *,
      label:labels(id, name, color)
    `);

    if (error) throw error;
    return data;
}

// Toggle image selection
export async function toggleImageSelection(imageId, isSelected) {
    const { data, error } = await supabase
        .from('images')
        .update({ is_selected: isSelected })
        .eq('id', imageId)
        .select(`
      *,
      label:labels(id, name, color)
    `)
        .single();

    if (error) throw error;
    return data;
}

// Update image comment
export async function updateImageComment(imageId, comment) {
    const { data, error } = await supabase
        .from('images')
        .update({ comment: comment || null })
        .eq('id', imageId)
        .select(`
      *,
      label:labels(id, name, color)
    `)
        .single();

    if (error) throw error;
    return data;
}

// Update image label
export async function updateImageLabel(imageId, labelId) {
    const { data, error } = await supabase
        .from('images')
        .update({ label_id: labelId || null })
        .eq('id', imageId)
        .select(`
      *,
      label:labels(id, name, color)
    `)
        .single();

    if (error) throw error;
    return data;
}

// Delete an image
export async function deleteImage(imageId) {
    const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId);

    if (error) throw error;
    return true;
}

export default supabase;
