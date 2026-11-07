import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Key,
  Users,
  Eye,
  Activity,
  FileCheck,
  CheckCircle,
  ArrowRight,
  Server,
  Layers,
  Database,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B0F19] transition-colors">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-royal/10 dark:bg-royal/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal-100 dark:bg-royal-950/80 border border-royal-200 dark:border-royal-800 text-royal-700 dark:text-royal-300 text-xs font-semibold mb-8 animate-fade-in">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero-Trust Enterprise Document Protection</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Secure Your Files.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal via-accent to-royal">
              Control Your Access.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            An intelligent document-sharing platform that protects organizational files through advanced AES-256-GCM authenticated encryption and strict role-based access control.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-royal hover:bg-royal-600 text-white font-semibold shadow-card hover:shadow-glow transition-all flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
            >
              Explore Features
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200/80 dark:border-navy-800 shadow-sm">
              <span className="text-2xl font-bold text-royal">AES-256</span>
              <p className="text-xs text-slate-500 mt-1">GCM Authenticated</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200/80 dark:border-navy-800 shadow-sm">
              <span className="text-2xl font-bold text-accent">Argon2id</span>
              <p className="text-xs text-slate-500 mt-1">Memory-Hard Hash</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200/80 dark:border-navy-800 shadow-sm">
              <span className="text-2xl font-bold text-emerald-600">3 Roles</span>
              <p className="text-xs text-slate-500 mt-1">Admin, Editor, Viewer</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900/80 border border-slate-200/80 dark:border-navy-800 shadow-sm">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">Deny-All</span>
              <p className="text-xs text-slate-500 mt-1">Zero-Trust Authorization</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE SECTIONS */}
      <section id="features" className="py-20 bg-white dark:bg-navy-950/50 border-y border-slate-200/80 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-royal mb-3">Enterprise Security Core</h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Engineered with Zero Compromises
            </p>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Every request is authenticated, authorized against object-level ACLs, and decrypted dynamically on the fly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-royal/60 transition-all">
              <div className="w-12 h-12 rounded-xl bg-royal-100 dark:bg-royal-950 text-royal flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Role-Based Access Control</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Clear OOP hierarchy with Admin, Editor, and Viewer domain classes. Granular controls enforce READ, DOWNLOAD, UPDATE, DELETE, and SHARE rules.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-royal/60 transition-all">
              <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">AES-256-GCM Encryption</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Files are encrypted at rest with hardware-accelerated AES-256-GCM. Unique 96-bit nonces prevent reuse and 128-bit auth tags reject tampered files.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-royal/60 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-5">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Secure File Upload & Storage</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Private server storage keeps original filenames isolated. Storage identifiers are random UUIDs with no public web URLs.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-royal/60 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">User & Role Management</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Administrators can enroll users, adjust roles, and activate/deactivate accounts with built-in safeguards to prevent organization lockouts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-royal/60 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-5">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Granular Permissions</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Share files with individual members while controlling whether they can download, edit, or resharing. Revocations take effect immediately.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-royal/60 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mb-5">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Comprehensive Audit Trails</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Immutable audit logs capture every login, upload, download, permission alteration, and unauthorized access attempt with IP attribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-royal mb-3">Workflow Mechanics</h2>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            How SecureVault Guards Your Data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 relative">
            <span className="text-4xl font-extrabold text-slate-200 dark:text-navy-700 block mb-3">01</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Upload & Verify</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              File arrives via encrypted TLS channel. Actor authorization and file size limits are verified on the backend.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 relative">
            <span className="text-4xl font-extrabold text-slate-200 dark:text-navy-700 block mb-3">02</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Cryptographic Seal</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              EncryptionService generates a random 96-bit nonce and encrypts payload with AES-256-GCM, producing a 128-bit auth tag.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 relative">
            <span className="text-4xl font-extrabold text-slate-200 dark:text-navy-700 block mb-3">03</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Isolated Storage</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Encrypted blob is written to a private vault path with UUID keys. No direct URL mapping or plaintext exposure exists.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 relative">
            <span className="text-4xl font-extrabold text-slate-200 dark:text-navy-700 block mb-3">04</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">Authenticated Decrypt</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              On download or preview, user permissions are validated. Ciphertext is authenticated and decrypted in memory on demand.
            </p>
          </div>
        </div>
      </section>

      {/* SECURITY ARCHITECTURE */}
      <section id="architecture" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-royal-400 mb-3">Under the Hood</h2>
            <p className="text-3xl font-extrabold">Security Architecture</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-navy-900/60 border border-navy-700">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="w-6 h-6 text-royal-400" />
                <h4 className="text-base font-bold">Cryptographic Engine</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  AES-256 in Galois/Counter Mode (GCM)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Argon2id Memory-Hard Password Hashing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Replay Protection via Nonce Cache
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-navy-900/60 border border-navy-700">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-6 h-6 text-accent-light" />
                <h4 className="text-base font-bold">Object-Oriented Design</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Abstract `User` with polymorphic `Admin`, `Editor`, `Viewer`
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Interfaces: `IPermission`, `IFileOperations`, `IEncryptionService`
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Encapsulation and Single Responsibility Principle
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-navy-900/60 border border-navy-700">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-6 h-6 text-emerald-400" />
                <h4 className="text-base font-bold">Deny-by-Default ACL</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  URL file ID parameter tampering blocked
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  HTTP-only SameSite session cookies
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Immutable audit records for all security events
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-royal mb-3">Got Questions?</h2>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              How does SecureVault encrypt files?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every document is encrypted with AES-256 in Galois/Counter Mode (GCM). A fresh 96-bit cryptographic nonce is generated per file. Files are stored as ciphertext, and any alteration of data or tag fails decryption automatically.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Can a Viewer download documents?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Only if the document owner or an Administrator has explicitly enabled the `canDownload` permission on that specific document. Otherwise, the viewer can only inspect the inline preview.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Can new sign-ups register as an Administrator?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No. Public registration is strictly constrained to the VIEWER role. Administrative privileges can only be provisioned by existing administrators through the User Management panel.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-navy-800 bg-white dark:bg-navy-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-royal flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              SecureVault Enterprise &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Compliant with AES-256-GCM Cryptographic Guidelines &amp; Zero-Trust Authorization.
          </p>
        </div>
      </footer>
    </div>
  );
};

