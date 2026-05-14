import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ClipboardList, Lock, Shield, Plus, ArrowRight } from 'lucide-react';
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
    const [newDeletionPassword, setNewDeletionPassword] = useState('');
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

        if (!newDeletionPassword.trim()) {
            toast.error('Please enter a deletion password');
            return;
        }

        if (newDeletionPassword.length < 4) {
            toast.error('Deletion password must be at least 4 characters');
            return;
        }

        if (newBoardPassword === newDeletionPassword) {
            toast.error('Deletion password must be different from viewing password');
            return;
        }

        setIsCreating(true);
        try {
            const board = await createBoard(newBoardName.trim(), newBoardPassword, newDeletionPassword);
            toast.success(`Board "${board.name}" created!`);
            setShowCreateModal(false);
            setNewBoardName('');
            setNewBoardPassword('');
            setNewDeletionPassword('');
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
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        style={{ display: 'inline-block', marginBottom: '1rem', padding: '0.5rem 1rem', background: 'var(--bg-glass)', border: '1px solid var(--border-accent)', borderRadius: '2rem', color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.5px' }}
                    >
                        <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-top' }} />
                        The New Standard for Creative Collaboration
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="hero-title"
                        style={{ fontSize: '4rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '1.5rem', lineHeight: 1.1 }}
                    >
                        Elevate Your <br />
                        <span style={{ color: 'var(--text-primary)', background: 'none', WebkitTextFillColor: 'initial' }}>Visual Workflow</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="hero-subtitle"
                        style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 2.5rem' }}
                    >
                        Create beautiful, secure reference boards for models and teams.
                        Upload inspiration, manage selections, and collaborate with seamless elegance.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}
                    >
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                            style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={20} />
                            Create New Board
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Boards Section */}
            <section className="board-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">
                            <ClipboardList className="text-primary" size={28} style={{ color: 'var(--accent-primary)' }} />
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
                            <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '50%', border: '1px solid var(--border-medium)' }}>
                                    <Sparkles size={40} style={{ color: 'var(--text-muted)' }} />
                                </div>
                            </div>
                            <h3>No boards yet</h3>
                            <p>Create your first moodboard to get started</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowCreateModal(true)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Plus size={18} />
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
                                            <Lock size={14} /> Created {formatDate(board.created_at)}
                                        </p>
                                        <span className="board-card-icon">
                                            <ArrowRight size={20} />
                                        </span>
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
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={20} className="text-primary" style={{ color: 'var(--accent-primary)' }} />
                                Create New Board
                            </div>
                        }
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
                                <label htmlFor="boardPassword">Viewing Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        id="boardPassword"
                                        type="password"
                                        className="input"
                                        placeholder="Password for models to view"
                                        value={newBoardPassword}
                                        onChange={(e) => setNewBoardPassword(e.target.value)}
                                        minLength={4}
                                        required
                                        style={{ paddingLeft: '36px' }}
                                    />
                                </div>
                                <small className="text-muted" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    Share this with models to give them viewing access
                                </small>
                            </div>
                            <div className="input-group" style={{ marginTop: 16 }}>
                                <label htmlFor="deletionPassword">Deletion Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        id="deletionPassword"
                                        type="password"
                                        className="input"
                                        placeholder="Password for deleting images"
                                        value={newDeletionPassword}
                                        onChange={(e) => setNewDeletionPassword(e.target.value)}
                                        minLength={4}
                                        required
                                        style={{ paddingLeft: '36px' }}
                                    />
                                </div>
                                <small className="text-muted" style={{ marginTop: 4 }}>
                                    Keep this private - required to delete images
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
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lock size={20} className="text-primary" style={{ color: 'var(--accent-primary)' }} />
                                Access "{selectedBoard.name}"
                            </div>
                        }
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
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        id="accessPassword"
                                        type="password"
                                        className="input"
                                        placeholder="Enter board password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                        required
                                        style={{ paddingLeft: '36px' }}
                                    />
                                </div>
                            </div>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
