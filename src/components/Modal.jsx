import { motion } from 'framer-motion';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    className = ''
}) {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`modal-backdrop ${className}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
