import { motion } from 'framer-motion';

export function Spinner({ size = 24 }) {
    return (
        <div
            className="spinner"
            style={{ width: size, height: size }}
        />
    );
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 'var(--radius-md)' }) {
    return (
        <div
            className="skeleton"
            style={{ width, height, borderRadius }}
        />
    );
}

export function LoadingOverlay({ message = 'Loading...' }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            style={{ flexDirection: 'column', gap: 'var(--space-lg)' }}
        >
            <Spinner size={48} />
            <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </motion.div>
    );
}

export function ImageCardSkeleton() {
    return (
        <div className="image-card">
            <Skeleton width="100%" height="100%" borderRadius="var(--radius-lg)" />
        </div>
    );
}

export function BoardCardSkeleton() {
    return (
        <div className="board-card" style={{ cursor: 'default' }}>
            <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={16} />
        </div>
    );
}
