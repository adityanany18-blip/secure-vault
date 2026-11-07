import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { FileItem, PermissionItem, User } from '../../types';
import { api } from '../../services/api';
import { Share2, Trash2, Check, UserPlus, AlertCircle, Shield } from 'lucide-react';
import { Badge } from '../common/Badge';

interface FileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  onUpdated: () => void;
}

export const FileShareModal: React.FC<FileShareModalProps> = ({
  isOpen,
  onClose,
  file,
  onUpdated,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Granular rights checkboxes
  const [canRead, setCanRead] = useState(true);
  const [canDownload, setCanDownload] = useState(true);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [canManagePermissions, setCanManagePermissions] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      loadData();
    }
  }, [isOpen, file]);

  const loadData = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const [usersData, permsData] = await Promise.all([
        api.getUsers({ limit: 100 }),
        api.getFilePermissions(file.id),
      ]);
      // Filter out file owner and current user if desired
      setUsers(usersData.users.filter((u: User) => u.id !== file.ownerId));
      setPermissions(permsData.permissions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load access permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedUserId) {
      setError('Please select a target user.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.grantPermission({
        fileId: file.id,
        userId: selectedUserId,
        canRead,
        canDownload,
        canUpdate,
        canDelete,
        canShare,
        canManagePermissions,
      });

      setSuccessMsg('Permissions granted successfully.');
      setSelectedUserId('');
      await loadData();
      onUpdated();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to grant permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (targetUserId: string) => {
    if (!file) return;
    if (!window.confirm('Are you sure you want to revoke this user’s file access?')) return;

    setLoading(true);
    setError(null);
    try {
      await api.revokePermission(file.id, targetUserId);
      setSuccessMsg('Access permission revoked.');
      await loadData();
      onUpdated();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke permission.');
    } finally {
      setLoading(false);
    }
  };

  if (!file) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Permissions & Sharing"
      subtitle={`Manage granular access for "${file.originalName}"`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Grant New Permission Form */}
        <form onSubmit={handleGrant} className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            <UserPlus className="w-4 h-4 text-royal" />
            Grant Access to User
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Select Member
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
            >
              <option value="">-- Choose a user --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) - [{u.role}]
                </option>
              ))}
            </select>
          </div>

          {/* Granular Permission Toggles */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Granular Permission Policy
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={canRead}
                  onChange={(e) => setCanRead(e.target.checked)}
                  className="rounded text-royal focus:ring-royal"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">READ (Preview)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={canDownload}
                  onChange={(e) => setCanDownload(e.target.checked)}
                  className="rounded text-royal focus:ring-royal"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">DOWNLOAD</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={canUpdate}
                  onChange={(e) => setCanUpdate(e.target.checked)}
                  className="rounded text-royal focus:ring-royal"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">UPDATE (Edit)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={canDelete}
                  onChange={(e) => setCanDelete(e.target.checked)}
                  className="rounded text-royal focus:ring-royal"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">DELETE</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={canShare}
                  onChange={(e) => setCanShare(e.target.checked)}
                  className="rounded text-royal focus:ring-royal"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">SHARE</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={canManagePermissions}
                  onChange={(e) => setCanManagePermissions(e.target.checked)}
                  className="rounded text-royal focus:ring-royal"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">MANAGE ACL</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !selectedUserId}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-royal hover:bg-royal-600 disabled:opacity-50 rounded-xl shadow-card transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              Apply Access Rule
            </button>
          </div>
        </form>

        {/* Existing ACL Table */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            Active User Permissions ({permissions.length})
          </h4>

          {permissions.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 dark:bg-navy-950 rounded-xl">
              No additional permissions granted. Only the owner and administrators have access.
            </p>
          ) : (
            <div className="border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-navy-800">
              {permissions.map((perm) => (
                <div
                  key={perm.id}
                  className="p-3 bg-white dark:bg-navy-900 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {perm.user?.name}
                      </span>
                      <span className="text-slate-400">({perm.user?.email})</span>
                      <Badge variant="info" size="sm">
                        {perm.user?.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {perm.canRead && <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-medium">READ</span>}
                      {perm.canDownload && <span className="bg-royal-50 dark:bg-royal-950/40 text-royal px-1.5 py-0.5 rounded text-[10px] font-medium">DOWNLOAD</span>}
                      {perm.canUpdate && <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 px-1.5 py-0.5 rounded text-[10px] font-medium">UPDATE</span>}
                      {perm.canDelete && <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 px-1.5 py-0.5 rounded text-[10px] font-medium">DELETE</span>}
                      {perm.canShare && <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 px-1.5 py-0.5 rounded text-[10px] font-medium">SHARE</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(perm.userId)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Revoke Permission"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

