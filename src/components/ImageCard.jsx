import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleImageSelection, updateImageComment, updateImageLabel, deleteImage, verifyDeletionPassword } from '../lib/supabase';
import { useToast } from './Toast';

export default function ImageCard({
    image,
    index,
    totalImages,
    labels = [],
    boardId,
    onUpdate,
    onDelete
}) {
    const [isSelected, setIsSelected] = useState(image.is_selected);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [comment, setComment] = useState(image.comment || '');
    const [isSavingComment, setIsSavingComment] = useState(false);

    // Deletion password modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletionPassword, setDeletionPassword] = useState('');
    const [isVerifyingDelete, setIsVerifyingDelete] = useState(false);

    const toast = useToast();

    // Calculate image number (newest first, so reverse the index)
    const imageNumber = totalImages - index;

    const handleToggle = useCallback(async (e) => {
        e?.stopPropagation();
        if (isUpdating) return;

        setIsUpdating(true);
        const newValue = !isSelected;
        setIsSelected(newValue); // Optimistic update

        try {
            const updated = await toggleImageSelection(image.id, newValue);
            onUpdate(updated);
        } catch (error) {
            setIsSelected(!newValue); // Revert on error
            toast.error('Failed to update selection');
            console.error('Toggle error:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [image, isSelected, isUpdating, onUpdate, toast]);

    // Open delete confirmation modal
    const handleDeleteClick = useCallback((e) => {
        e.stopPropagation();
        setDeletionPassword('');
        setShowDeleteModal(true);
    }, []);

    // Verify deletion password and delete
    const handleConfirmDelete = useCallback(async (e) => {
        e.preventDefault();
        if (isVerifyingDelete || !deletionPassword.trim()) return;

        setIsVerifyingDelete(true);
        try {
            // Verify deletion password
            const result = await verifyDeletionPassword(boardId, deletionPassword);

            if (!result.success) {
                toast.error(result.error || 'Incorrect deletion password');
                setIsVerifyingDelete(false);
                return;
            }

            // Password verified, proceed with deletion
            setIsDeleting(true);
            await deleteImage(image.id);
            onDelete(image.id);
            toast.success('Image deleted');
            setShowDeleteModal(false);
            setShowDetails(false);
        } catch (error) {
            toast.error('Failed to delete image');
            console.error('Delete error:', error);
        } finally {
            setIsVerifyingDelete(false);
            setIsDeleting(false);
        }
    }, [boardId, deletionPassword, image.id, isVerifyingDelete, onDelete, toast]);

    const handleSaveComment = useCallback(async () => {
        if (isSavingComment) return;

        setIsSavingComment(true);
        try {
            const updated = await updateImageComment(image.id, comment.trim());
            onUpdate(updated);
            toast.success('Comment saved');
        } catch (error) {
            toast.error('Failed to save comment');
            console.error('Comment error:', error);
        } finally {
            setIsSavingComment(false);
        }
    }, [image.id, comment, isSavingComment, onUpdate, toast]);

    const handleLabelChange = useCallback(async (labelId) => {
        try {
            const updated = await updateImageLabel(image.id, labelId || null);
            onUpdate(updated);
            toast.success(labelId ? 'Label applied' : 'Label removed');
        } catch (error) {
            toast.error('Failed to update label');
            console.error('Label error:', error);
        }
    }, [image.id, onUpdate, toast]);

    // Fallback image URL if primary fails
    const imageUrl = imageError
        ? `https://drive.google.com/uc?export=view&id=${image.drive_file_id}`
        : image.drive_url;

    const currentLabel = image.label;

    return (
        <>
            <div
                className={`image-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setShowDetails(true)}
                style={{ cursor: 'pointer' }}
            >
                <img
                    src={imageUrl}
                    alt={image.filename}
                    loading="lazy"
                    onError={() => setImageError(true)}
                />

                {/* Image Number Badge */}
                <div className="image-number">#{imageNumber}</div>

                {/* Label Badge */}
                {currentLabel && (
                    <div
                        className="image-label-badge"
                        style={{ backgroundColor: currentLabel.color }}
                    >
                        {currentLabel.name}
                    </div>
                )}

                {/* Comment Indicator */}
                {image.comment && (
                    <div className="image-comment-indicator" title={image.comment}>
                        💬
                    </div>
                )}

                <div className="image-card-overlay">
                    <div className="image-card-actions">
                        <button
                            className="image-card-delete"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            title="Delete image"
                        >
                            {isDeleting ? '...' : '🗑'}
                        </button>
                    </div>

                    <div className="image-card-checkbox">
                        <label className="checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={handleToggle}
                                disabled={isUpdating}
                            />
                            <span className="checkbox-custom">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </span>
                        </label>
                        <span>{isSelected ? 'Selected' : 'Select'}</span>
                    </div>
                </div>
            </div>

            {/* Image Details Modal */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-backdrop"
                        onClick={() => setShowDetails(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="modal image-details-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Image #{imageNumber}</h2>
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => setShowDetails(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="modal-body">
                                {/* Image Preview */}
                                <div className="image-preview-large">
                                    <img src={imageUrl} alt={image.filename} />
                                </div>

                                {/* Selection Toggle */}
                                <div className="image-detail-row">
                                    <span className="detail-label">Status</span>
                                    <button
                                        className={`btn ${isSelected ? 'btn-success' : 'btn-secondary'}`}
                                        onClick={handleToggle}
                                        disabled={isUpdating}
                                    >
                                        {isSelected ? '✓ Selected' : 'Mark as Selected'}
                                    </button>
                                </div>

                                {/* Label Selection */}
                                <div className="image-detail-row">
                                    <span className="detail-label">Label</span>
                                    <select
                                        className="input select"
                                        value={currentLabel?.id || ''}
                                        onChange={(e) => handleLabelChange(e.target.value)}
                                    >
                                        <option value="">No Label</option>
                                        {labels.map(label => (
                                            <option key={label.id} value={label.id}>
                                                {label.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Comment */}
                                <div className="input-group">
                                    <label htmlFor="imageComment">Comment</label>
                                    <textarea
                                        id="imageComment"
                                        className="input textarea"
                                        placeholder="Add a note about this image..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={3}
                                    />
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSaveComment}
                                        disabled={isSavingComment || comment === (image.comment || '')}
                                    >
                                        {isSavingComment ? 'Saving...' : 'Save Comment'}
                                    </button>
                                </div>

                                {/* Delete Button */}
                                <div className="image-detail-row" style={{ marginTop: 16 }}>
                                    <span className="detail-label">Actions</span>
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleDeleteClick}
                                        disabled={isDeleting}
                                    >
                                        🗑 Delete Image
                                    </button>
                                </div>

                                {/* File Info */}
                                <div className="image-file-info">
                                    <span className="text-muted">{image.filename}</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-backdrop"
                        onClick={() => setShowDeleteModal(false)}
                        style={{ zIndex: 1100 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="modal"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: 380 }}
                        >
                            <div className="modal-header">
                                <h2>🔐 Delete Image</h2>
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleConfirmDelete}>
                                <div className="modal-body">
                                    <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                                        Enter the deletion password to remove this image.
                                    </p>
                                    <div className="input-group">
                                        <label htmlFor="deletionPwd">Deletion Password</label>
                                        <input
                                            id="deletionPwd"
                                            type="password"
                                            className="input"
                                            placeholder="Enter deletion password"
                                            value={deletionPassword}
                                            onChange={(e) => setDeletionPassword(e.target.value)}
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={isVerifyingDelete}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-danger"
                                        disabled={isVerifyingDelete || !deletionPassword.trim()}
                                    >
                                        {isVerifyingDelete ? 'Verifying...' : 'Delete'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
