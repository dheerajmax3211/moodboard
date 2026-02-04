import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getBoardByName, verifyBoardPassword, getBoardImages, getBoardLabels, toggleImageSelection, updateImageComment, updateImageLabel, deleteImage, verifyDeletionPassword } from '../lib/supabase';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ImageCard from '../components/ImageCard';
import UploadModal from '../components/UploadModal';
import LabelManager from '../components/LabelManager';
import { Spinner, ImageCardSkeleton } from '../components/Loader';

// Filter types
const FILTER_ALL = 'all';
const FILTER_SELECTED = 'selected';
const FILTER_UNSELECTED = 'unselected';

export default function Board() {
    const { boardName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    // Board state
    const [board, setBoard] = useState(location.state?.board || null);
    const [isAuthenticated, setIsAuthenticated] = useState(location.state?.authenticated || false);
    const [images, setImages] = useState([]);
    const [labels, setLabels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Password modal (if not already authenticated)
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Upload modal
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Label manager modal
    const [showLabelManager, setShowLabelManager] = useState(false);

    // Filters
    const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
    const [selectedLabelFilter, setSelectedLabelFilter] = useState('');
    
    // Selected image for detail view (index in filteredImages, null = no selection)
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [showFullscreen, setShowFullscreen] = useState(false);

    // Load board if not passed via state
    useEffect(() => {
        const loadBoard = async () => {
            if (!board) {
                try {
                    const boardData = await getBoardByName(decodeURIComponent(boardName));
                    if (boardData) {
                        setBoard(boardData);
                        setShowPasswordModal(true);
                    } else {
                        toast.error('Board not found');
                        navigate('/');
                    }
                } catch (error) {
                    console.error('Load board error:', error);
                    toast.error('Failed to load board');
                    navigate('/');
                }
            } else if (!isAuthenticated) {
                setShowPasswordModal(true);
            }
        };

        loadBoard();
    }, [boardName, board, isAuthenticated, navigate, toast]);

    // Load images and labels when authenticated
    const loadData = useCallback(async () => {
        if (!board || !isAuthenticated) return;

        setIsLoading(true);
        try {
            const [imagesData, labelsData] = await Promise.all([
                getBoardImages(board.id),
                getBoardLabels(board.id)
            ]);
            setImages(imagesData || []);
            setLabels(labelsData || []);
        } catch (error) {
            console.error('Load data error:', error);
            toast.error('Failed to load board data');
        } finally {
            setIsLoading(false);
        }
    }, [board, isAuthenticated, toast]);

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, loadData]);

    // Password verification
    const handleVerifyPassword = async (e) => {
        e.preventDefault();

        if (!password.trim()) {
            toast.error('Please enter the password');
            return;
        }

        setIsVerifying(true);
        try {
            const result = await verifyBoardPassword(board.name, password);

            if (result.success) {
                setIsAuthenticated(true);
                setShowPasswordModal(false);
                toast.success('Access granted!');
            } else {
                toast.error(result.error || 'Incorrect password');
            }
        } catch (error) {
            console.error('Verify error:', error);
            toast.error('Failed to verify password');
        } finally {
            setIsVerifying(false);
        }
    };

    // Handle image update (checkbox toggle, comment, label)
    const handleImageUpdate = useCallback((updatedImage) => {
        setImages(prev => prev.map(img =>
            img.id === updatedImage.id ? updatedImage : img
        ));
    }, []);

    // Handle image delete
    const handleImageDelete = useCallback((imageId) => {
        setImages(prev => prev.filter(img => img.id !== imageId));
    }, []);

    // Handle labels change
    const handleLabelsChange = useCallback((newLabels) => {
        setLabels(newLabels);
    }, []);

    // Filter images
    const filteredImages = useMemo(() => {
        let result = images;

        // Apply selection filter
        if (activeFilter === FILTER_SELECTED) {
            result = result.filter(img => img.is_selected);
        } else if (activeFilter === FILTER_UNSELECTED) {
            result = result.filter(img => !img.is_selected);
        }

        // Apply label filter
        if (selectedLabelFilter) {
            result = result.filter(img => img.label?.id === selectedLabelFilter);
        }

        return result;
    }, [images, activeFilter, selectedLabelFilter]);

    // Calculate stats
    const totalImages = images.length;
    const selectedImages = images.filter(img => img.is_selected).length;
    const filteredCount = filteredImages.length;

    // If not authenticated, show only the password modal
    if (!isAuthenticated) {
        return (
            <AnimatePresence>
                {showPasswordModal && board && (
                    <Modal
                        isOpen={showPasswordModal}
                        onClose={() => navigate('/')}
                        title={`Access "${board.name}"`}
                        footer={
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/')}
                                    disabled={isVerifying}
                                >
                                    Go Back
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleVerifyPassword}
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? (
                                        <>
                                            <Spinner size={18} />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Enter Board'
                                    )}
                                </button>
                            </>
                        }
                    >
                        <form onSubmit={handleVerifyPassword}>
                            <p style={{ marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
                                Enter the password to view this board's images.
                            </p>
                            <div className="input-group">
                                <label htmlFor="boardPassword">Password</label>
                                <input
                                    id="boardPassword"
                                    type="password"
                                    className="input"
                                    placeholder="Enter board password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="board-page"
        >
            {/* Header */}
            <header className="board-header">
                <div className="container">
                    <div className="board-header-content">
                        <div className="board-header-left">
                            <button
                                className="back-btn"
                                onClick={() => navigate('/')}
                                title="Back to boards"
                            >
                                ←
                            </button>
                            <h1 className="board-title">{board?.name}</h1>
                        </div>

                        <div className="board-header-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowLabelManager(true)}
                            >
                                🏷️ Labels
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowUploadModal(true)}
                            >
                                📤 Add Images
                            </button>
                        </div>

                        <div className="board-stats">
                            <span className="board-stat">
                                📷 {totalImages} {totalImages === 1 ? 'image' : 'images'}
                            </span>
                            <span className="board-stat selected">
                                ✓ {selectedImages} selected
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="filters-bar">
                <div className="container">
                    <div className="filters-content">
                        {/* Selection Filter */}
                        <div className="filter-group">
                            <span className="filter-label">Filter:</span>
                            <div className="filter-buttons">
                                <button
                                    className={`filter-btn ${activeFilter === FILTER_ALL ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(FILTER_ALL)}
                                >
                                    All
                                </button>
                                <button
                                    className={`filter-btn ${activeFilter === FILTER_SELECTED ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(FILTER_SELECTED)}
                                >
                                    ✓ Selected ({selectedImages})
                                </button>
                                <button
                                    className={`filter-btn ${activeFilter === FILTER_UNSELECTED ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(FILTER_UNSELECTED)}
                                >
                                    Not Selected
                                </button>
                            </div>
                        </div>

                        {/* Label Filter */}
                        {labels.length > 0 && (
                            <div className="filter-group">
                                <span className="filter-label">Label:</span>
                                <select
                                    className="input select filter-select"
                                    value={selectedLabelFilter}
                                    onChange={(e) => setSelectedLabelFilter(e.target.value)}
                                >
                                    <option value="">All Labels</option>
                                    {labels.map(label => (
                                        <option key={label.id} value={label.id}>
                                            {label.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Showing count */}
                        {(activeFilter !== FILTER_ALL || selectedLabelFilter) && (
                            <span className="filter-count">
                                Showing {filteredCount} of {totalImages}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="board-content">
                <div className="container">
                    {isLoading ? (
                        <div className="image-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <ImageCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="empty-state"
                        >
                            {images.length === 0 ? (
                                <>
                                    <div className="empty-state-icon">📸</div>
                                    <h3>No images yet</h3>
                                    <p>Add your first reference images to get started</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowUploadModal(true)}
                                    >
                                        Add Images
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="empty-state-icon">🔍</div>
                                    <h3>No matching images</h3>
                                    <p>Try adjusting your filters</p>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setActiveFilter(FILTER_ALL);
                                            setSelectedLabelFilter('');
                                        }}
                                    >
                                        Clear Filters
                                    </button>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        <div className="image-grid">
                            {filteredImages.map((image, index) => (
                                <ImageCard
                                    key={image.id}
                                    image={image}
                                    index={index}
                                    totalImages={filteredImages.length}
                                    labels={labels}
                                    boardId={board?.id}
                                    onUpdate={handleImageUpdate}
                                    onDelete={handleImageDelete}
                                    onOpenDetails={() => setSelectedImageIndex(index)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Upload Button (Mobile) */}
            <button
                className="fab"
                onClick={() => setShowUploadModal(true)}
                title="Add images"
            >
                +
            </button>

            {/* Upload Modal */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                boardId={board?.id}
                labels={labels}
                onUploadComplete={loadData}
            />

            {/* Label Manager Modal */}
            <LabelManager
                isOpen={showLabelManager}
                onClose={() => setShowLabelManager(false)}
                boardId={board?.id}
                labels={labels}
                onLabelsChange={handleLabelsChange}
            />

            {/* Image Detail Modal */}
            <AnimatePresence>
                {selectedImageIndex !== null && filteredImages[selectedImageIndex] && (() => {
                    const image = filteredImages[selectedImageIndex];
                    const imageNumber = filteredImages.length - selectedImageIndex;
                    const hasPrev = selectedImageIndex > 0;
                    const hasNext = selectedImageIndex < filteredImages.length - 1;
                    const imageUrl = image.drive_url;
                    
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="modal-backdrop"
                            onClick={() => setSelectedImageIndex(null)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setSelectedImageIndex(null);
                                if (e.key === 'ArrowLeft' && hasPrev) setSelectedImageIndex(prev => prev - 1);
                                if (e.key === 'ArrowRight' && hasNext) setSelectedImageIndex(prev => prev + 1);
                            }}
                            tabIndex={0}
                            ref={(el) => el && el.focus()}
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
                                    <div className="modal-header-nav">
                                        <button
                                            className="btn btn-ghost btn-icon nav-arrow"
                                            onClick={() => setSelectedImageIndex(prev => prev - 1)}
                                            disabled={!hasPrev}
                                            title="Previous image (←)"
                                        >
                                            ←
                                        </button>
                                        <h2>Image #{imageNumber}</h2>
                                        <button
                                            className="btn btn-ghost btn-icon nav-arrow"
                                            onClick={() => setSelectedImageIndex(prev => prev + 1)}
                                            disabled={!hasNext}
                                            title="Next image (→)"
                                        >
                                            →
                                        </button>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => setSelectedImageIndex(null)}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="modal-body">
                                    {/* Image Preview - Click to fullscreen */}
                                    <div 
                                        className="image-preview-large"
                                        onClick={() => setShowFullscreen(true)}
                                        style={{ cursor: 'zoom-in' }}
                                        title="Click to view fullscreen"
                                    >
                                        <img src={imageUrl} alt={image.filename} />
                                        <div className="fullscreen-hint">🔍 Click to enlarge</div>
                                    </div>

                                    {/* Fullscreen Overlay */}
                                    <AnimatePresence>
                                        {showFullscreen && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fullscreen-overlay"
                                                onClick={() => setShowFullscreen(false)}
                                                onKeyDown={(e) => {
                                                    e.stopPropagation();
                                                    if (e.key === 'Escape') setShowFullscreen(false);
                                                    if (e.key === 'ArrowLeft' && hasPrev) {
                                                        setSelectedImageIndex(prev => prev - 1);
                                                    }
                                                    if (e.key === 'ArrowRight' && hasNext) {
                                                        setSelectedImageIndex(prev => prev + 1);
                                                    }
                                                }}
                                                tabIndex={0}
                                                ref={(el) => el && el.focus()}
                                            >
                                                {/* Navigation Arrow - Left */}
                                                {hasPrev && (
                                                    <button
                                                        className="fullscreen-nav-btn fullscreen-nav-prev"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedImageIndex(prev => prev - 1);
                                                        }}
                                                    >
                                                        ‹
                                                    </button>
                                                )}

                                                {/* Image */}
                                                <motion.img
                                                    initial={{ scale: 0.8 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0.8 }}
                                                    src={imageUrl}
                                                    alt={image.filename}
                                                    className="fullscreen-image"
                                                    onClick={(e) => e.stopPropagation()}
                                                />

                                                {/* Navigation Arrow - Right */}
                                                {hasNext && (
                                                    <button
                                                        className="fullscreen-nav-btn fullscreen-nav-next"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedImageIndex(prev => prev + 1);
                                                        }}
                                                    >
                                                        ›
                                                    </button>
                                                )}

                                                {/* Close hint */}
                                                <div className="fullscreen-close-hint">
                                                    Click anywhere or press ESC to close • ← → to navigate
                                                </div>

                                                {/* Image counter */}
                                                <div className="fullscreen-counter">
                                                    {selectedImageIndex + 1} / {filteredImages.length}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Selection Toggle */}
                                    <div className="image-detail-row">
                                        <span className="detail-label">Status</span>
                                        <button
                                            className={`btn ${image.is_selected ? 'btn-success' : 'btn-secondary'}`}
                                            onClick={async () => {
                                                try {
                                                    const updated = await toggleImageSelection(image.id, !image.is_selected);
                                                    handleImageUpdate(updated);
                                                } catch (error) {
                                                    toast.error('Failed to update selection');
                                                }
                                            }}
                                        >
                                            {image.is_selected ? '✓ Selected' : 'Mark as Selected'}
                                        </button>
                                    </div>

                                    {/* Label Selection */}
                                    <div className="image-detail-row">
                                        <span className="detail-label">Label</span>
                                        <select
                                            className="input select"
                                            value={image.label?.id || ''}
                                            onChange={async (e) => {
                                                try {
                                                    const updated = await updateImageLabel(image.id, e.target.value || null);
                                                    handleImageUpdate(updated);
                                                    toast.success(e.target.value ? 'Label applied' : 'Label removed');
                                                } catch (error) {
                                                    toast.error('Failed to update label');
                                                }
                                            }}
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
                                    <div className="image-detail-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                        <span className="detail-label">Comment</span>
                                        <textarea
                                            className="input textarea"
                                            placeholder="Add a note about this image..."
                                            defaultValue={image.comment || ''}
                                            onBlur={async (e) => {
                                                if (e.target.value !== (image.comment || '')) {
                                                    try {
                                                        const updated = await updateImageComment(image.id, e.target.value.trim());
                                                        handleImageUpdate(updated);
                                                        toast.success('Comment saved');
                                                    } catch (error) {
                                                        toast.error('Failed to save comment');
                                                    }
                                                }
                                            }}
                                            rows={3}
                                        />
                                    </div>

                                    {/* Delete Button */}
                                    <div className="image-detail-row" style={{ borderBottom: 'none', justifyContent: 'center' }}>
                                        <button
                                            className="btn btn-danger"
                                            onClick={async () => {
                                                const deletionPwd = prompt('Enter deletion password to delete this image:');
                                                if (!deletionPwd) return;
                                                
                                                try {
                                                    const result = await verifyDeletionPassword(board.id, deletionPwd);
                                                    if (!result.success) {
                                                        toast.error('Incorrect deletion password');
                                                        return;
                                                    }
                                                    await deleteImage(image.id);
                                                    handleImageDelete(image.id);
                                                    toast.success('Image deleted');
                                                    setSelectedImageIndex(null);
                                                } catch (error) {
                                                    toast.error('Failed to delete image');
                                                }
                                            }}
                                        >
                                            🗑 Delete Image
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </motion.div>
    );
}
