import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Upload, File, CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultFolder?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultFolder = 'General',
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [folder, setFolder] = useState(defaultFolder);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: globalThis.File) => {
    setError(null);
    // 25 MB max limit check
    if (file.size > 25 * 1024 * 1024) {
      setError('File exceeds maximum 25 MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setProgress(20);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('folder', folder);

    try {
      setProgress(50);
      await api.uploadFile(formData);
      setProgress(100);
      setTimeout(() => {
        resetState();
        onSuccess();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'File upload failed.');
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Encrypted File"
      subtitle="Files are encrypted using AES-256-GCM before storage."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and Drop Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-royal bg-royal-50/60 dark:bg-royal-950/30'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-navy-700 hover:border-royal/60 dark:hover:border-royal/60 bg-slate-50/50 dark:bg-navy-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <File className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB &bull; {selectedFile.type || 'Binary'}
                </p>
              </div>
              <p className="text-xs text-royal font-medium">Click to select a different file</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-royal-100 dark:bg-royal-950 text-royal mx-auto flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Drag and drop your document here, or <span className="text-royal font-semibold">browse</span>
              </p>
              <p className="text-xs text-slate-400">
                Supports PDF, DOCX, XLSX, TXT, JSON, MD, Images (up to 25 MB)
              </p>
            </div>
          )}
        </div>

        {/* Folder Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Category Folder
          </label>
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            disabled={uploading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
          >
            <option value="General">General Documents</option>
            <option value="Compliance">Compliance & Legal</option>
            <option value="Finance">Financial Audits</option>
            <option value="Architecture">Engineering & Architecture</option>
            <option value="Executive">Executive & Board</option>
          </select>
        </div>

        {/* Encryption Assurance Notice */}
        <div className="p-3 rounded-xl bg-royal-50/60 dark:bg-royal-950/30 border border-royal-100 dark:border-royal-900/60 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-royal flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Upon submission, a unique 96-bit nonce will be generated. The file is encrypted via AES-256-GCM and stored privately.
          </p>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
              <span>Encrypting & Storing...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-royal to-accent transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-navy-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-royal hover:bg-royal-600 disabled:opacity-50 rounded-xl shadow-card transition-all"
          >
            <Lock className="w-4 h-4" />
            {uploading ? 'Encrypting...' : 'Encrypt & Upload'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

