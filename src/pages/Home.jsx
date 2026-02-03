import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllBoards, createBoard, verifyBoardPassword } from '../lib/supabase';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { Spinner, BoardCardSkeleton } from '../components/Loader';

export default function Home() {
    const navigate = useNavigate();
    const toast = useToast();

    const [boards, setBoards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create Board Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardPassword, setNewBoardPassword] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Password Modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Load boards
    const loadBoards = useCallback(async () => {
        try {
            const data = await getAllBoards();
            setBoards(data || []);
        } catch (error) {
            console.error('Failed to load boards:', error);
            toast.error('Failed to load boards. Check your Supabase configuration.');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadBoards();
    }, [loadBoards]);

    // Create Board
    const handleCreateBoard = async (e) => {
        e.preventDefault();

        if (!newBoardName.trim()) {
            toast.error('Please enter a board name');
            return;
        }

        if (!newBoardPassword.trim()) {
            toast.error('Please enter a password');
            return;
        }

        if (newBoardPassword.length < 4) {
            toast.error('Password must be at least 4 characters');
            return;
        }

        setIsCreating(true);
        try {
            const board = await createBoard(newBoardName.trim(), newBoardPassword);
            toast.success(`Board "${board.name}" created!`);
            setShowCreateModal(false);
            setNewBoardName('');
            setNewBoardPassword('');
            loadBoards();

            // Navigate to the new board
            navigate(`/board/${encodeURIComponent(board.name)}`, {
                state: { board, authenticated: true }
            });
        } catch (error) {
            console.error('Create error:', error);
            toast.error(error.message || 'Failed to create board');
        } finally {
            setIsCreating(false);
        }
    };

    // Board Click - Open Password Modal
    const handleBoardClick = (board) => {
        setSelectedBoard(board);
        setPassword('');
        setShowPasswordModal(true);
    };

    // Verify Password
    const handleVerifyPassword = async (e) => {
        e.preventDefault();

        if (!password.trim()) {
            toast.error('Please enter the password');
            return;
        }

        setIsVerifying(true);
        try {
            const result = await verifyBoardPassword(selectedBoard.name, password);

            if (result.success) {
                setShowPasswordModal(false);
                navigate(`/board/${encodeURIComponent(selectedBoard.name)}`, {
                    state: { board: result.board, authenticated: true }
                });
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

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="home-page"
        >
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="hero-title"
                    >
                        Moodboards
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="hero-subtitle"
                    >
                        Create beautiful reference boards for your models.
                        Upload inspiration, share securely, collaborate effortlessly.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            ✨ Create New Board
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Boards Section */}
            <section className="board-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">
                            <span className="icon">📋</span>
                            Your Boards
                        </h2>
                    </div>

                    {isLoading ? (
                        <div className="boards-grid">
                            {[1, 2, 3].map(i => (
                                <BoardCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : boards.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="empty-state"
                        >
                            <div className="empty-state-icon">🎨</div>
                            <h3>No boards yet</h3>
                            <p>Create your first moodboard to get started</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowCreateModal(true)}
                            >
                                Create Board
                            </button>
                        </motion.div>
                    ) : (
                        <div className="boards-grid">
                            <AnimatePresence>
                                {boards.map((board, index) => (
                                    <motion.div
                                        key={board.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="board-card"
                                        onClick={() => handleBoardClick(board)}
                                    >
                                        <h3 className="board-card-name">{board.name}</h3>
                                        <p className="board-card-meta">
                                            🔒 Created {formatDate(board.created_at)}
                                        </p>
                                        <span className="board-card-icon">→</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </section>

            {/* Create Board Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <Modal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        title="Create New Board"
                        footer={
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateBoard}
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <>
                                            <Spinner size={18} />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Board'
                                    )}
                                </button>
                            </>
                        }
                    >
                        <form onSubmit={handleCreateBoard}>
                            <div className="input-group mb-lg">
                                <label htmlFor="boardName">Board Name</label>
                                <input
                                    id="boardName"
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Summer Collection 2024"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="boardPassword">Password</label>
                                <input
                                    id="boardPassword"
                                    type="password"
                                    className="input"
                                    placeholder="Enter a secure password"
                                    value={newBoardPassword}
                                    onChange={(e) => setNewBoardPassword(e.target.value)}
                                    minLength={4}
                                    required
                                />
                                <small className="text-muted" style={{ marginTop: 4 }}>
                                    Share this password with your model to give them access
                                </small>
                            </div>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Password Modal */}
            <AnimatePresence>
                {showPasswordModal && selectedBoard && (
                    <Modal
                        isOpen={showPasswordModal}
                        onClose={() => setShowPasswordModal(false)}
                        title={`Access "${selectedBoard.name}"`}
                        footer={
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowPasswordModal(false)}
                                    disabled={isVerifying}
                                >
                                    Cancel
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
                            <div className="input-group">
                                <label htmlFor="accessPassword">Password</label>
                                <input
                                    id="accessPassword"
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
        </motion.div>
    );
}
