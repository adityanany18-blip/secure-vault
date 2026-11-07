import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FolderLock,
  Search,
  Filter,
  Upload,
  Eye,
  Download,
  Share2,
  Trash2,
  Edit2,
  History,
  Grid,
  List,
  Lock,
  ShieldCheck,
  FileText,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { FileItem } from '../types';
import { Badge } from '../components/common/Badge';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import { FileShareModal } from '../components/files/FileShareModal';
import { FileVersionModal } from '../components/files/FileVersionModal';
import { FileRenameModal } from '../components/files/FileRenameModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { FileUploadModal } from '../components/files/FileUploadModal';

export const FilesPage: React.FC = () => {
  const { user, isAdmin, isEditor, isViewer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [filterView, setFilterView] = useState<'all' | 'my-files' | 'shared-with-me'>(
    (searchParams.get('filter') as any) || (isAdmin ? 'all' : isEditor ? 'my-files' : 'shared-with-me')
  );
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [versionFile, setVersionFile] = useState<FileItem | null>(null);
  const [renameFile, setRenameFile] = useState<FileItem | null>(null);
  const [deleteFileItem, setDeleteFileItem] = useState<FileItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [filterView, selectedFolder, search]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFiles({
        folder: selectedFolder !== 'All' ? selectedFolder : undefined,
        search: search.trim() || undefined,
        filter: filterView,
        limit: 100,
      });
      setFiles(data.files || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load vault files.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteFileItem) return;
    setDeleteLoading(true);
    try {
      await api.deleteFile(deleteFileItem.id);
      setDeleteFileItem(null);
      await loadFiles();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    if (!file.userPermissions?.canDownload) return;
    try {
      await api.downloadFile(file.id, file.originalName);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Encrypted Vault Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, manage, preview, and share organization assets encrypted with AES-256-GCM.
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-royal hover:bg-royal-600 text-white text-xs sm:text-sm font-semibold shadow-card hover:shadow-glow transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* View Filter Pills */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-navy-800 rounded-xl overflow-x-auto">
            {isAdmin && (
              <button
                onClick={() => setFilterView('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterView === 'all'
                    ? 'bg-white dark:bg-navy-900 text-royal shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Files
              </button>
            )}
            {!isViewer && (
              <button
                onClick={() => setFilterView('my-files')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterView === 'my-files'
                    ? 'bg-white dark:bg-navy-900 text-royal shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                My Uploads
              </button>
            )}
            <button
              onClick={() => setFilterView('shared-with-me')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterView === 'shared-with-me'
                  ? 'bg-white dark:bg-navy-900 text-royal shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Shared With Me
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
            />
          </div>

          {/* Folder & View Toggle */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
            >
              <option value="All">All Folders</option>
              <option value="General">General</option>
              <option value="Compliance">Compliance</option>
              <option value="Finance">Finance</option>
              <option value="Architecture">Architecture</option>
              <option value="Executive">Executive</option>
            </select>

            <div className="flex items-center border border-slate-200 dark:border-navy-700 rounded-xl overflow-hidden p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'list' ? 'bg-royal text-white' : 'text-slate-400'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'grid' ? 'bg-royal text-white' : 'text-slate-400'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FILES CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <div className="w-8 h-8 border-4 border-royal border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-800 text-slate-400 mx-auto flex items-center justify-center">
            <FolderLock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Documents Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || selectedFolder !== 'All'
              ? 'No files matched your active search query or filter.'
              : 'You have not uploaded or been granted access to any files in this category yet.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Document Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Encryption</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-royal-50 dark:bg-royal-950 text-royal flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs block">
                          {file.originalName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="info" size="sm">
                        {file.folder}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {(file.fileSize / 1024).toFixed(1)} KB
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{file.owner.name}</span>
                      <span className="text-[10px] text-slate-400 block">{file.owner.role}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <Lock className="w-3 h-3" />
                        AES-256-GCM
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Preview */}
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 rounded-lg text-royal hover:bg-royal-50 dark:hover:bg-royal-950/60 transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={!file.userPermissions?.canDownload}
                          className={`p-1.5 rounded-lg transition-colors ${
                            file.userPermissions?.canDownload
                              ? 'text-slate-600 dark:text-slate-300 hover:text-royal hover:bg-slate-100 dark:hover:bg-navy-800'
                              : 'text-slate-300 dark:text-navy-700 cursor-not-allowed'
                          }`}
                          title={
                            file.userPermissions?.canDownload
                              ? 'Download Decrypted File'
                              : 'Download permission not granted'
                          }
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Share */}
                        {(file.userPermissions?.canShare || file.userPermissions?.canManagePermissions) && (
                          <button
                            onClick={() => setShareFile(file)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                            title="Manage Access ACL"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Version History */}
                        {file.userPermissions?.canUpdate && (
                          <button
                            onClick={() => setVersionFile(file)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-royal hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                            title="Version History & Revision"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}

                        {/* Rename */}
                        {file.userPermissions?.canUpdate && (
                          <button
                            onClick={() => setRenameFile(file)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-royal hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                            title="Rename Metadata"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        {file.userPermissions?.canDelete && (
                          <button
                            onClick={() => setDeleteFileItem(file)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card hover:shadow-glow transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-royal-50 dark:bg-royal-950 text-royal flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Badge variant="info" size="sm">
                    {file.folder}
                  </Badge>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={file.originalName}>
                  {file.originalName}
                </h4>

                <p className="text-xs text-slate-400 mt-1">
                  {(file.fileSize / 1024).toFixed(1)} KB &bull; By {file.owner.name}
                </p>

                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 w-fit">
                  <Lock className="w-3 h-3" />
                  AES-256-GCM Hardware Encrypted
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                <button
                  onClick={() => setPreviewFile(file)}
                  className="px-3 py-1.5 text-xs font-semibold text-royal bg-royal-50 dark:bg-royal-950 hover:bg-royal-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>

                <div className="flex items-center space-x-1">
                  {file.userPermissions?.canDownload && (
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 text-slate-500 hover:text-royal hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  {(file.userPermissions?.canShare || file.userPermissions?.canManagePermissions) && (
                    <button
                      onClick={() => setShareFile(file)}
                      className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}

                  {file.userPermissions?.canDelete && (
                    <button
                      onClick={() => setDeleteFileItem(file)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          setUploadModalOpen(false);
          loadFiles();
        }}
      />

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      <FileShareModal
        isOpen={!!shareFile}
        onClose={() => setShareFile(null)}
        file={shareFile}
        onUpdated={loadFiles}
      />

      <FileVersionModal
        isOpen={!!versionFile}
        onClose={() => setVersionFile(null)}
        file={versionFile}
        onUpdated={loadFiles}
      />

      <FileRenameModal
        isOpen={!!renameFile}
        onClose={() => setRenameFile(null)}
        file={renameFile}
        onUpdated={loadFiles}
      />

      <ConfirmDialog
        isOpen={!!deleteFileItem}
        onClose={() => setDeleteFileItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Encrypted Document"
        message={`Are you sure you want to permanently delete "${deleteFileItem?.originalName}" from the encrypted vault repository?`}
        confirmText="Confirm Delete"
        isDestructive={true}
        loading={deleteLoading}
      />
    </div>
  );
};

