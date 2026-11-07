import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { FileItem } from '../../types';
import { api } from '../../services/api';
import { History, Upload, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface FileVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  onUpdated: () => void;
}

export const FileVersionModal: React.FC<FileVersionModalProps> = ({
  isOpen,
  onClose,
  file,
  onUpdated,
}) => {
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!file) return null;

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.uploadNewVersion(file.id, formData);
      setSelectedFile(null);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload version.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Version History"
      subtitle={`Track revisions for "${file.originalName}"`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Active Version */}
        <div className="p-3.5 rounded-xl bg-royal-50/60 dark:bg-royal-950/30 border border-royal-200 dark:border-royal-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-royal dark:text-royal-300 uppercase tracking-wider">
                Current Active Version
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
              {(file.fileSize / 1024).toFixed(1)} KB
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Last updated: {new Date(file.updatedAt).toLocaleString()}
          </p>
        </div>

        {/* Upload New Version Form */}
        {file.userPermissions?.canUpdate && (
          <form onSubmit={handleUploadNewVersion} className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800 space-y-3">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Upload New Revision
            </span>

            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-3 border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-xl text-center cursor-pointer hover:border-royal transition-colors text-xs text-slate-600 dark:text-slate-300"
            >
              {selectedFile ? (
                <span className="font-semibold text-royal">{selectedFile.name}</span>
              ) : (
                <span>Click to select replacement file</span>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!selectedFile || loading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-royal hover:bg-royal-600 disabled:opacity-50 rounded-xl shadow-card transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                {loading ? 'Encrypting...' : 'Deploy Revision'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

