import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { createLabel, updateLabel, deleteLabel, LABEL_COLORS } from '../lib/supabase';
import { useToast } from './Toast';
import { Spinner } from './Loader';

export default function LabelManager({
    isOpen,
    onClose,
    boardId,
    labels,
    onLabelsChange
}) {
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingLabel, setEditingLabel] = useState(null);
    const toast = useToast();

    const handleCreateLabel = async (e) => {
        e.preventDefault();
        if (!newLabelName.trim()) {
            toast.error('Please enter a label name');
            return;
        }

        setIsCreating(true);
        try {
            const newLabel = await createLabel(boardId, newLabelName.trim(), newLabelColor);
            onLabelsChange([...labels, newLabel]);
            setNewLabelName('');
            setNewLabelColor(LABEL_COLORS[0]);
            toast.success(`Label "${newLabel.name}" created`);
        } catch (error) {
            toast.error(error.message || 'Failed to create label');
            console.error('Create label error:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateLabel = async () => {
        if (!editingLabel || !editingLabel.name.trim()) return;

        try {
            const updated = await updateLabel(editingLabel.id, editingLabel.name.trim(), editingLabel.color);
            onLabelsChange(labels.map(l => l.id === updated.id ? updated : l));
            setEditingLabel(null);
            toast.success('Label updated');
        } catch (error) {
            toast.error('Failed to update label');
            console.error('Update label error:', error);
        }
    };

    const handleDeleteLabel = async (labelId, labelName) => {
        if (!confirm(`Delete label "${labelName}"? Images with this label will become unlabeled.`)) return;

        try {
            await deleteLabel(labelId);
            onLabelsChange(labels.filter(l => l.id !== labelId));
            toast.success('Label deleted');
        } catch (error) {
            toast.error('Failed to delete label');
            console.error('Delete label error:', error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    title="Manage Labels"
                    footer={
                        <button className="btn btn-secondary" onClick={onClose}>
                            Done
                        </button>
                    }
                >
                    {/* Create New Label */}
                    <form onSubmit={handleCreateLabel} className="label-create-form">
                        <div className="input-group">
                            <label>Create New Label</label>
                            <div className="label-input-row">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Label name..."
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    maxLength={30}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isCreating || !newLabelName.trim()}
                                >
                                    {isCreating ? <Spinner size={16} /> : '+'}
                                </button>
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="label-color-picker">
                            {LABEL_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-swatch ${newLabelColor === color ? 'active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewLabelColor(color)}
                                    title={color}
                                />
                            ))}
                        </div>
                    </form>

                    {/* Existing Labels */}
                    <div className="labels-list">
                        <h4 className="labels-list-title">
                            Existing Labels ({labels.length})
                        </h4>

                        {labels.length === 0 ? (
                            <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                                No labels yet. Create one above!
                            </p>
                        ) : (
                            <div className="labels-grid">
                                {labels.map(label => (
                                    <motion.div
                                        key={label.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="label-item"
                                    >
                                        {editingLabel?.id === label.id ? (
                                            <div className="label-edit-form">
                                                <input
                                                    type="text"
                                                    className="input input-sm"
                                                    value={editingLabel.name}
                                                    onChange={(e) => setEditingLabel({ ...editingLabel, name: e.target.value })}
                                                    autoFocus
                                                />
                                                <div className="label-color-picker small">
                                                    {LABEL_COLORS.map(color => (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            className={`color-swatch small ${editingLabel.color === color ? 'active' : ''}`}
                                                            style={{ backgroundColor: color }}
                                                            onClick={() => setEditingLabel({ ...editingLabel, color })}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="label-edit-actions">
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => setEditingLabel(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={handleUpdateLabel}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    className="label-badge"
                                                    style={{ backgroundColor: label.color }}
                                                >
                                                    {label.name}
                                                </div>
                                                <div className="label-actions">
                                                    <button
                                                        className="btn btn-ghost btn-icon btn-sm"
                                                        onClick={() => setEditingLabel({ ...label })}
                                                        title="Edit label"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-icon btn-sm"
                                                        onClick={() => handleDeleteLabel(label.id, label.name)}
                                                        title="Delete label"
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </AnimatePresence>
    );
}
