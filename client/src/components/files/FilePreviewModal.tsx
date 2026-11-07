import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { FileItem } from '../../types';
import { api } from '../../services/api';
import {
  Download,
  Lock,
  KeyRound,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'crypto'>('preview');

  useEffect(() => {
    if (isOpen && file) {
      loadContent();
    } else {
      setContent(null);
      setError(null);
    }
  }, [isOpen, file]);

  const loadContent = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await api.previewFileText(file.id);
      setContent(text);
    } catch (err: any) {
      setError(err.message || 'Unable to decrypt file preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !file.userPermissions?.canDownload) return;
    try {
      await api.downloadFile(file.id, file.originalName);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';
  const canDownload = file.userPermissions?.canDownload ?? false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={file.originalName}
      subtitle={`Encrypted with AES-256-GCM • ${(file.fileSize / 1024).toFixed(1)} KB`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'preview'
                  ? 'bg-royal text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
              }`}
            >
              Document Preview
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'crypto'
                  ? 'bg-royal text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
              }`}
            >
              Cryptographic Metadata
            </button>
          </div>

          {/* Download Action */}
          <button
            onClick={handleDownload}
            disabled={!canDownload}
            title={canDownload ? 'Download decrypted file' : 'Download permission is not granted'}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              canDownload
                ? 'bg-royal hover:bg-royal-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            {canDownload ? 'Download Decrypted' : 'Download Restricted'}
          </button>
        </div>

        {/* Tab 1: Preview Content */}
        {activeTab === 'preview' && (
          <div className="min-h-[300px] max-h-[500px] overflow-y-auto rounded-xl bg-slate-50 dark:bg-navy-950 p-4 border border-slate-200/80 dark:border-navy-800">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-royal" />
                <p className="text-xs text-slate-500">Decrypting file with AES-256-GCM...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-2 text-center">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Preview Failed
                </p>
                <p className="text-xs text-slate-500 max-w-sm">{error}</p>
              </div>
            ) : isImage ? (
              <div className="flex justify-center p-4">
                <img
                  src={api.getPreviewBlobUrl(file.id)}
                  alt={file.originalName}
                  className="max-h-96 rounded-lg object-contain shadow-md"
                />
              </div>
            ) : isPdf ? (
              <div className="h-96 w-full">
                <iframe
                  src={api.getPreviewBlobUrl(file.id)}
                  title={file.originalName}
                  className="w-full h-full rounded-lg border-0"
                />
              </div>
            ) : (
              <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                {content}
              </pre>
            )}
          </div>
        )}

        {/* Tab 2: Cryptographic Metadata */}
        {activeTab === 'crypto' && (
          <div className="space-y-3 p-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Encryption Algorithm
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-royal bg-royal-50 dark:bg-royal-950 px-2 py-0.5 rounded border border-royal-200 dark:border-royal-800">
                  {file.encryptionVersion.toUpperCase()}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Cryptographic Nonce (IV - 96 bit):
                  </span>
                  <button
                    onClick={() => copyToClipboard(file.nonce, 'nonce')}
                    className="text-[11px] text-royal flex items-center gap-1 hover:underline"
                  >
                    {copiedKey === 'nonce' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'nonce' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-[11px] bg-white dark:bg-navy-900 p-2 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 break-all select-all">
                  {file.nonce}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    GCM Authentication Tag (128 bit):
                  </span>
                  <button
                    onClick={() => copyToClipboard(file.authenticationTag, 'tag')}
                    className="text-[11px] text-royal flex items-center gap-1 hover:underline"
                  >
                    {copiedKey === 'tag' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'tag' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-[11px] bg-white dark:bg-navy-900 p-2 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 break-all select-all">
                  {file.authenticationTag}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Internal Storage Vault Key:
                </span>
                <p className="font-mono text-[11px] bg-white dark:bg-navy-900 p-2 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 break-all select-all mt-1">
                  {file.storageKey}
                </p>
              </div>
            </div>

            {/* Ownership and Date Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800">
                <span className="text-slate-400 block mb-1">Owner</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {file.owner.name} ({file.owner.role})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800">
                <span className="text-slate-400 block mb-1">Uploaded On</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(file.createdAt).toLocaleDateString()} at{' '}
                  {new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-navy-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

