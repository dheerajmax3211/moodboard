import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { Spinner } from './Loader';
import { uploadImages, openDrivePicker } from '../lib/googleDrive';
import { addMultipleImages } from '../lib/supabase';
import { useToast } from './Toast';

export default function UploadModal({
    isOpen,
    onClose,
    boardId,
    labels = [],
    onUploadComplete
}) {
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'picker'
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [selectedLabelId, setSelectedLabelId] = useState('');
    const fileInputRef = useRef(null);
    const toast = useToast();

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            file => file.type.startsWith('image/')
        );

        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles]);
        }
    }, []);

    const handleFileSelect = useCallback((e) => {
        const selectedFiles = Array.from(e.target.files).filter(
            file => file.type.startsWith('image/')
        );

        if (selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...selectedFiles]);
        }
    }, []);

    const removeFile = useCallback((index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error('Please select some images first');
            return;
        }

        setIsUploading(true);
        setProgress({ current: 0, total: files.length });

        try {
            // Upload to Google Drive
            const uploadedFiles = await uploadImages(files, (current, total) => {
                setProgress({ current, total });
            });

            if (uploadedFiles.length > 0) {
                // Save references to Supabase with optional label
                await addMultipleImages(boardId, uploadedFiles, selectedLabelId || null);
                toast.success(`Successfully uploaded ${uploadedFiles.length} images!`);
                onUploadComplete();
                handleClose();
            } else {
                toast.error('Failed to upload images. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload images. Please check your Google Drive setup.');
        } finally {
            setIsUploading(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const handlePickFromDrive = async () => {
        try {
            setIsUploading(true);
            const pickedFiles = await openDrivePicker();

            if (pickedFiles.length > 0) {
                // Save references to Supabase with optional label
                await addMultipleImages(boardId, pickedFiles, selectedLabelId || null);
                toast.success(`Added ${pickedFiles.length} images from Google Drive!`);
                onUploadComplete();
                handleClose();
            }
        } catch (error) {
            console.error('Picker error:', error);
            toast.error('Failed to access Google Drive. Please check your setup.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFiles([]);
        setActiveTab('upload');
        setIsUploading(false);
        setProgress({ current: 0, total: 0 });
        setSelectedLabelId('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={handleClose}
                    title="Add Images"
                    className="upload-modal"
                    footer={
                        activeTab === 'upload' ? (
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleClose}
                                    disabled={isUploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUpload}
                                    disabled={isUploading || files.length === 0}
                                >
                                    {isUploading ? (
                                        <>
                                            <Spinner size={18} />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>Upload {files.length > 0 ? `(${files.length})` : ''}</>
                                    )}
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn btn-secondary"
                                onClick={handleClose}
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                        )
                    }
                >
                    {/* Tabs */}
                    <div className="upload-tabs">
                        <button
                            className={`upload-tab ${activeTab === 'upload' ? 'active' : ''}`}
                            onClick={() => setActiveTab('upload')}
                        >
                            📤 Upload New
                        </button>
                        <button
                            className={`upload-tab ${activeTab === 'picker' ? 'active' : ''}`}
                            onClick={() => setActiveTab('picker')}
                        >
                            📁 From Drive
                        </button>
                    </div>

                    {/* Label Selection */}
                    {labels.length > 0 && (
                        <div className="input-group">
                            <label>Apply Label (optional)</label>
                            <select
                                className="input select"
                                value={selectedLabelId}
                                onChange={(e) => setSelectedLabelId(e.target.value)}
                            >
                                <option value="">No Label</option>
                                {labels.map(label => (
                                    <option key={label.id} value={label.id}>
                                        {label.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Upload Tab */}
                    {activeTab === 'upload' && (
                        <>
                            <div
                                className={`dropzone ${isDragging ? 'active' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="dropzone-icon">📷</div>
                                <p style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
                                    Drag & drop images here
                                </p>
                                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                                    or click to browse
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {/* File Previews */}
                            {files.length > 0 && (
                                <div className="file-preview-grid">
                                    {files.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="file-preview"
                                            onClick={() => removeFile(index)}
                                            style={{ cursor: 'pointer' }}
                                            title="Click to remove"
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                            />
                                            <div className="file-preview-name">{file.name}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Progress */}
                            {isUploading && progress.total > 0 && (
                                <div className="upload-progress">
                                    <div className="upload-progress-bar">
                                        <div
                                            className="upload-progress-fill"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        />
                                    </div>
                                    <p className="upload-progress-text">
                                        Uploading {progress.current} of {progress.total}...
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Picker Tab */}
                    {activeTab === 'picker' && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
                            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>📁</div>
                            <p style={{ marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
                                Select existing images from your Google Drive
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={handlePickFromDrive}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Spinner size={18} />
                                        Opening...
                                    </>
                                ) : (
                                    'Open Google Drive'
                                )}
                            </button>
                        </div>
                    )}
                </Modal>
            )}
        </AnimatePresence>
    );
}
