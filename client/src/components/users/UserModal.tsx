import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { User, RoleType, UserStatus } from '../../types';
import { api } from '../../services/api';
import { AlertCircle, ShieldAlert, Check } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: User | null;
  onSuccess: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSuccess,
}) => {
  const isEditing = !!userToEdit;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleType>('VIEWER');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setStatus(userToEdit.status);
      setPassword('');
      setError(null);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('VIEWER');
      setStatus('ACTIVE');
      setError(null);
    }
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && userToEdit) {
        await api.updateUser(userToEdit.id, {
          name: name.trim(),
          role,
          status,
        });
      } else {
        if (!password || password.length < 8) {
          setError('Password must be at least 8 characters long.');
          setLoading(false);
          return;
        }
        await api.createUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          status,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modify User Profile' : 'Enroll New Organization User'}
      subtitle={
        isEditing
          ? 'Manage role assignments and account active status.'
          : 'Create a secured user account with cryptographic password hashing.'
      }
      maxWidth="md"
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
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || isEditing}
            className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40 ${
              isEditing ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            placeholder="user@organization.io"
          />
        </div>

        {!isEditing && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Initial Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
              placeholder="Minimum 8 characters"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assigned Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleType)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
            >
              <option value="VIEWER">VIEWER (Read-Only)</option>
              <option value="EDITOR">EDITOR (Manage & Upload)</option>
              <option value="ADMIN">ADMIN (Full Authority)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="PENDING">PENDING APPROVAL</option>
            </select>
          </div>
        </div>

        {/* Protection Safeguard Alert */}
        {isEditing && userToEdit?.role === 'ADMIN' && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Security Note: The backend prohibits deactivating or demoting the last active administrator to prevent organization lockout.
            </span>
          </div>
        )}

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
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-royal hover:bg-royal-600 disabled:opacity-50 rounded-xl shadow-card transition-all"
          >
            {loading ? 'Processing...' : isEditing ? 'Update User' : 'Enroll User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

