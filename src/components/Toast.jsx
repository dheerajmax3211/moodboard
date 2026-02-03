import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const success = useCallback((message) => addToast(message, 'success'), [addToast]);
    const error = useCallback((message) => addToast(message, 'error'), [addToast]);
    const info = useCallback((message) => addToast(message, 'info'), [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts }) {
    return (
        <div className="toast-container">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`toast toast-${toast.type}`}
                    >
                        <span className="toast-icon">
                            {toast.type === 'success' && '✓'}
                            {toast.type === 'error' && '✕'}
                            {toast.type === 'info' && 'ℹ'}
                        </span>
                        <span className="toast-message">{toast.message}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
