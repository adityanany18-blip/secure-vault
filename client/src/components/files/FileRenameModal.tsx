import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FileItem } from '../../types';
import { api } from '../../services/api';
import { AlertCircle } from 'lucide-react';

interface FileRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  onUpdated: () => void;
}

export const FileRenameModal: React.FC<FileRenameModalProps> = ({
  isOpen,
  onClose,
  file,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      setName(file.originalName);
      setFolder(file.folder || 'General');
      setError(null);
    }
  }, [file]);

  if (!file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('File name cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.updateFile(file.id, {
        originalName: name.trim(),
        folder: folder.trim(),
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update file metadata.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit File Metadata"
      subtitle="Rename document or change organization folder."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Document Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Category Folder
          </label>
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
          >
            <option value="General">General Documents</option>
            <option value="Compliance">Compliance & Legal</option>
            <option value="Finance">Financial Audits</option>
            <option value="Architecture">Engineering & Architecture</option>
            <option value="Executive">Executive & Board</option>
          </select>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-navy-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-royal hover:bg-royal-600 disabled:opacity-50 rounded-xl shadow-card transition-all"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

