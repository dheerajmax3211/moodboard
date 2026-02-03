import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getBoardByName, verifyBoardPassword, getBoardImages, getBoardLabels } from '../lib/supabase';
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
                                    onUpdate={handleImageUpdate}
                                    onDelete={handleImageDelete}
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
        </motion.div>
    );
}
