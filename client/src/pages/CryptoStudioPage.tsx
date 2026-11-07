import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  FileCode,
  Upload,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  FileText,
  Terminal,
  Layers,
  Sparkles,
  BookOpen,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/common/Badge';

export const CryptoStudioPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt' | 'keys'>('encrypt');

  // Encryption state
  const [encryptMode, setEncryptMode] = useState<'text' | 'file'>('text');
  const [plainText, setPlainText] = useState('Confidential Project Titan Operational Blueprint — Strict Internal Distribution.');
  const [encryptFile, setEncryptFile] = useState<File | null>(null);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [useMasterKey, setUseMasterKey] = useState(false);
  const [saveToVault, setSaveToVault] = useState(false);
  const [encryptFolder, setEncryptFolder] = useState('Compliance');
  const [encryptLoading, setEncryptLoading] = useState(false);
  const [encryptError, setEncryptError] = useState<string | null>(null);
  const [encryptedOutput, setEncryptedOutput] = useState<{
    ciphertextBase64: string;
    ciphertextHex: string;
    nonce: string;
    authTag: string;
    keyUsed: string;
    originalName: string;
    originalSize: number;
    encryptedSize: number;
    bundleJson: string;
  } | null>(null);

  // Decryption state
  const [decryptMode, setDecryptMode] = useState<'text' | 'file'>('text');
  const [cipherInput, setCipherInput] = useState('');
  const [nonceInput, setNonceInput] = useState('');
  const [authTagInput, setAuthTagInput] = useState('');
  const [bundleJsonInput, setBundleJsonInput] = useState('');
  const [decryptFile, setDecryptFile] = useState<File | null>(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [useMasterKeyForDecrypt, setUseMasterKeyForDecrypt] = useState(false);
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decryptedResult, setDecryptedResult] = useState<{
    plaintext?: string;
    isText: boolean;
    filename: string;
    mimeType: string;
    size: number;
    decryptedBase64: string;
  } | null>(null);

  // Key Info state
  const [keyInfo, setKeyInfo] = useState<any>(null);

  // Copy feedback tracking
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const encryptFileInputRef = useRef<HTMLInputElement>(null);
  const decryptFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadKeyInfo();
    generateNewKey();
  }, []);

  const loadKeyInfo = async () => {
    try {
      const data = await api.getCryptoKeyInfo();
      setKeyInfo(data);
    } catch {
      // ignore
    }
  };

  const generateNewKey = async () => {
    try {
      const data = await api.generateCryptoKey();
      if (data?.key) {
        setEncryptionKey(data.key);
      }
    } catch {
      // ignore
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 1. Handle Encryption
  const handleEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setEncryptLoading(true);
    setEncryptError(null);
    setEncryptedOutput(null);

    try {
      if (encryptMode === 'file' && encryptFile) {
        const formData = new FormData();
        formData.append('file', encryptFile);
        if (!useMasterKey && encryptionKey) {
          formData.append('keyHex', encryptionKey.trim());
        }
        formData.append('folder', encryptFolder);
        formData.append('saveToVault', String(saveToVault));
        const res = await api.encryptData(formData);
        setEncryptedOutput(res);
      } else {
        if (!plainText.trim()) {
          setEncryptError('Plaintext cannot be empty.');
          setEncryptLoading(false);
          return;
        }
        const res = await api.encryptData({
          plaintext: plainText,
          keyHex: !useMasterKey ? encryptionKey.trim() : undefined,
          originalName: 'encrypted_document.txt',
          folder: encryptFolder,
          saveToVault,
        });
        setEncryptedOutput(res);
      }
    } catch (err: any) {
      setEncryptError(err.message || 'Encryption operation failed.');
    } finally {
      setEncryptLoading(false);
    }
  };

  // 2. Handle Decryption
  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecryptLoading(true);
    setDecryptError(null);
    setDecryptedResult(null);

    try {
      if (decryptMode === 'file' && decryptFile) {
        const formData = new FormData();
        formData.append('file', decryptFile);
        if (!useMasterKeyForDecrypt && decryptionKey) {
          formData.append('keyHex', decryptionKey.trim());
        }
        const res = await api.decryptData(formData);
        setDecryptedResult(res);
      } else {
        const res = await api.decryptData({
          ciphertext: cipherInput.trim() || undefined,
          nonce: nonceInput.trim() || undefined,
          authTag: authTagInput.trim() || undefined,
          bundleJson: bundleJsonInput.trim() || undefined,
          keyHex: !useMasterKeyForDecrypt ? decryptionKey.trim() : undefined,
        });
        setDecryptedResult(res);
      }
    } catch (err: any) {
      setDecryptError(err.message || 'Decryption failed: Cryptographic authentication error.');
    } finally {
      setDecryptLoading(false);
    }
  };

  // Handle Download Encrypted Bundle File
  const handleDownloadEncryptedFile = () => {
    if (!encryptedOutput) return;
    const blob = new Blob([encryptedOutput.bundleJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${encryptedOutput.originalName || 'file'}.aes256gcm.enc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Handle Download Decrypted Restored File
  const handleDownloadDecryptedFile = () => {
    if (!decryptedResult) return;
    let blob: Blob;
    if (decryptedResult.isText && decryptedResult.plaintext) {
      blob = new Blob([decryptedResult.plaintext], { type: decryptedResult.mimeType || 'text/plain' });
    } else {
      const binary = atob(decryptedResult.decryptedBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: decryptedResult.mimeType || 'application/octet-stream' });
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = decryptedResult.filename || 'restored_decrypted_document.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white border border-navy-700/80 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-royal/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-royal-500/20 text-royal-300 border border-royal-400/30 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-royal" />
                ADMINISTRATOR CRYPTOGRAPHIC ENGINE
              </span>
              <Badge variant="primary" size="sm">
                AES-256-GCM
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Cryptographic Studio & Key Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time hardware-accelerated encryption, ciphertext authentication, and key lifecycle governance.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-navy-800/80 p-3 rounded-2xl border border-navy-700">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div className="text-left text-xs">
              <span className="text-slate-400 block font-medium">Cipher Algorithm</span>
              <span className="font-mono font-bold text-white">AES-256-GCM</span>
            </div>
          </div>
        </div>
      </div>

      {/* EDUCATIONAL INFORMATION SECTION (Requirement 4) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-royal mb-4">
          <BookOpen className="w-4 h-4" />
          <span>Educational Information: Cryptographic Principles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Encryption Concept */}
          <div className="p-4 rounded-2xl bg-royal-50/50 dark:bg-royal-950/20 border border-royal-100 dark:border-royal-900/60 space-y-1.5">
            <div className="flex items-center gap-2 text-royal font-bold text-sm">
              <Lock className="w-4 h-4" />
              <span>Encryption</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Encryption is the process of converting plaintext into ciphertext using an encryption algorithm and a key to protect information from unauthorized access.
            </p>
          </div>

          {/* Decryption Concept */}
          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/60 space-y-1.5">
            <div className="flex items-center gap-2 text-accent font-bold text-sm">
              <Unlock className="w-4 h-4" />
              <span>Decryption</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Decryption is the process of converting ciphertext into plaintext using the appropriate decryption key.
            </p>
          </div>

          {/* Conclusion */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Conclusion</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Encryption is an important security technique that protects data by converting readable information into an unreadable format. It is widely used in banking, communication, cloud storage, and secure file-sharing systems.
            </p>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-navy-800 pb-2">
        <button
          onClick={() => setActiveTab('encrypt')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'encrypt'
              ? 'bg-royal text-white shadow-card'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          Encryption Engine
        </button>

        <button
          onClick={() => setActiveTab('decrypt')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'decrypt'
              ? 'bg-royal text-white shadow-card'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Unlock className="w-4 h-4" />
          Decryption Engine
        </button>

        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'keys'
              ? 'bg-royal text-white shadow-card'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Vault Key Telemetry
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ENCRYPTION MODULE */}
      {/* ============================================================== */}
      {activeTab === 'encrypt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Input Configuration Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Encrypt Content (AES-256-GCM)
                </h3>
                <p className="text-xs text-slate-400">Transform plaintext or documents into authenticated ciphertext.</p>
              </div>

              {/* Input Mode Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-navy-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setEncryptMode('text')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    encryptMode === 'text' ? 'bg-white dark:bg-navy-900 text-royal shadow-sm font-semibold' : 'text-slate-500'
                  }`}
                >
                  Plaintext
                </button>
                <button
                  type="button"
                  onClick={() => setEncryptMode('file')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    encryptMode === 'file' ? 'bg-white dark:bg-navy-900 text-royal shadow-sm font-semibold' : 'text-slate-500'
                  }`}
                >
                  File Upload
                </button>
              </div>
            </div>

            {encryptError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{encryptError}</span>
              </div>
            )}

            <form onSubmit={handleEncrypt} className="space-y-4">
              {/* Plaintext Box vs File Upload */}
              {encryptMode === 'text' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Plaintext Input Message
                    </label>
                    <button
                      type="button"
                      onClick={() => setPlainText('CONFIDENTIAL: Q4 Financial Ledger & Zero-Trust Infrastructure Credentials.')}
                      className="text-[11px] text-royal hover:underline"
                    >
                      Insert Sample Plaintext
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-950 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40 leading-relaxed"
                    placeholder="Enter plaintext to encrypt..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Upload Document to Encrypt
                  </label>
                  <input
                    ref={encryptFileInputRef}
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEncryptFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div
                    onClick={() => encryptFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-navy-700 hover:border-royal rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/40 dark:bg-navy-950/50"
                  >
                    {encryptFile ? (
                      <div className="space-y-1">
                        <FileCode className="w-8 h-8 text-royal mx-auto" />
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {encryptFile.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(encryptFile.size / 1024).toFixed(1)} KB &bull; Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Select a file to encrypt (PDF, DOCX, XLSX, TXT, JSON, MD)
                        </p>
                        <p className="text-[11px] text-slate-400">Up to 25 MB</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Encryption Key Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    256-bit Encryption Key (64 Hex Characters)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useMasterKey}
                        onChange={(e) => setUseMasterKey(e.target.checked)}
                        className="rounded text-royal"
                      />
                      <span>Use Vault Master Key</span>
                    </label>
                    {!useMasterKey && (
                      <button
                        type="button"
                        onClick={generateNewKey}
                        className="text-[11px] text-royal font-semibold flex items-center gap-1 hover:underline"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Generate Key
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    disabled={useMasterKey}
                    value={useMasterKey ? '[VAULT_SYSTEM_MASTER_KEY_PROTECTED]' : encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
                    placeholder="Enter or generate 64-character hex key..."
                  />
                  {!useMasterKey && encryptionKey && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(encryptionKey, 'key')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-semibold text-royal bg-royal-50 dark:bg-royal-950 rounded-lg"
                    >
                      {copiedField === 'key' ? 'Copied!' : 'Copy Key'}
                    </button>
                  )}
                </div>
              </div>

              {/* Save to Vault Option */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToVault}
                    onChange={(e) => setSaveToVault(e.target.checked)}
                    className="rounded text-royal"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Also persist encrypted file into Organization Vault
                  </span>
                </label>

                {saveToVault && (
                  <select
                    value={encryptFolder}
                    onChange={(e) => setEncryptFolder(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-[11px]"
                  >
                    <option value="Compliance">Compliance</option>
                    <option value="Finance">Finance</option>
                    <option value="Architecture">Architecture</option>
                    <option value="General">General</option>
                  </select>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={encryptLoading || (encryptMode === 'file' && !encryptFile)}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-royal hover:bg-royal-600 disabled:opacity-50 shadow-card hover:shadow-glow transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {encryptLoading ? 'Executing AES-256-GCM Encryption...' : 'Encrypt with AES-256-GCM'}
              </button>
            </form>
          </div>

          {/* Output Display Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Encrypted Output (Ciphertext)
                </h3>
                <p className="text-xs text-slate-400">Authenticated ciphertext, nonce, and integrity tag.</p>
              </div>

              {encryptedOutput && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(encryptedOutput.ciphertextBase64, 'cipher')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-royal bg-royal-50 dark:bg-royal-950 hover:bg-royal-100 transition-colors"
                  >
                    {copiedField === 'cipher' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'cipher' ? 'Copied' : 'Copy Ciphertext'}
                  </button>

                  <button
                    onClick={handleDownloadEncryptedFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-royal hover:bg-royal-600 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .enc Bundle
                  </button>
                </div>
              )}
            </div>

            {encryptedOutput ? (
              <div className="space-y-3">
                {/* Ciphertext Display Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Ciphertext (Base64 Encoded):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {encryptedOutput.encryptedSize} bytes encrypted
                    </span>
                  </div>
                  <textarea
                    readOnly
                    rows={4}
                    value={encryptedOutput.ciphertextBase64}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all focus:outline-none"
                  />
                </div>

                {/* Cryptographic Parameters Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Nonce / IV (96-bit)</span>
                      <button
                        onClick={() => copyToClipboard(encryptedOutput.nonce, 'nonce')}
                        className="text-[10px] text-royal hover:underline"
                      >
                        {copiedField === 'nonce' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all select-all">
                      {encryptedOutput.nonce}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">GCM Auth Tag (128-bit)</span>
                      <button
                        onClick={() => copyToClipboard(encryptedOutput.authTag, 'tag')}
                        className="text-[10px] text-royal hover:underline"
                      >
                        {copiedField === 'tag' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all select-all">
                      {encryptedOutput.authTag}
                    </p>
                  </div>
                </div>

                {/* Complete Bundle JSON */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Exportable Encryption Bundle (JSON):
                    </span>
                    <button
                      onClick={() => copyToClipboard(encryptedOutput.bundleJson, 'bundle')}
                      className="text-[10px] text-royal font-semibold hover:underline"
                    >
                      {copiedField === 'bundle' ? 'Copied!' : 'Copy Bundle'}
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-200 dark:border-navy-800 max-h-36 overflow-y-auto">
                    {encryptedOutput.bundleJson}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-72 border-2 border-dashed border-slate-200 dark:border-navy-800 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                <Lock className="w-10 h-10 text-slate-300 dark:text-navy-700" />
                <p className="text-xs font-medium">Ready for encryption</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Enter plaintext or upload a document and click "Encrypt with AES-256-GCM" to generate ciphertext.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: DECRYPTION MODULE */}
      {/* ============================================================== */}
      {activeTab === 'decrypt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Decryption Input Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Decrypt Ciphertext (AES-256-GCM)
                </h3>
                <p className="text-xs text-slate-400">Restore original plaintext or documents using the authenticated key.</p>
              </div>

              {/* Input Mode Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-navy-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setDecryptMode('text')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    decryptMode === 'text' ? 'bg-white dark:bg-navy-900 text-royal shadow-sm font-semibold' : 'text-slate-500'
                  }`}
                >
                  Ciphertext / Bundle
                </button>
                <button
                  type="button"
                  onClick={() => setDecryptMode('file')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    decryptMode === 'file' ? 'bg-white dark:bg-navy-900 text-royal shadow-sm font-semibold' : 'text-slate-500'
                  }`}
                >
                  Upload .enc
                </button>
              </div>
            </div>

            {decryptError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="leading-relaxed">{decryptError}</span>
              </div>
            )}

            <form onSubmit={handleDecrypt} className="space-y-4">
              {decryptMode === 'file' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Upload Encrypted Bundle File (.enc / .json)
                  </label>
                  <input
                    ref={decryptFileInputRef}
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDecryptFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div
                    onClick={() => decryptFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-navy-700 hover:border-royal rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/40 dark:bg-navy-950/50"
                  >
                    {decryptFile ? (
                      <div className="space-y-1">
                        <FileCode className="w-8 h-8 text-royal mx-auto" />
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {decryptFile.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(decryptFile.size / 1024).toFixed(1)} KB &bull; Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Select an encrypted SecureVault bundle (.enc or .json)
                        </p>
                        <p className="text-[11px] text-slate-400">Automatic nonce and tag extraction</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ciphertext (Base64 or Hex) OR Bundle JSON:
                    </label>
                    <textarea
                      rows={3}
                      value={cipherInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCipherInput(val);
                        // Auto-extract if user pastes JSON bundle!
                        try {
                          const parsed = JSON.parse(val);
                          if (parsed.ciphertext && parsed.nonce && parsed.authTag) {
                            setCipherInput(parsed.ciphertext);
                            setNonceInput(parsed.nonce);
                            setAuthTagInput(parsed.authTag);
                          }
                        } catch {
                          // normal string
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
                      placeholder="Paste ciphertext base64/hex or complete bundle JSON..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nonce / IV (24 Hex Chars)
                      </label>
                      <input
                        type="text"
                        value={nonceInput}
                        onChange={(e) => setNonceInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                        placeholder="12-byte IV in hex"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Auth Tag (32 Hex Chars)
                      </label>
                      <input
                        type="text"
                        value={authTagInput}
                        onChange={(e) => setAuthTagInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                        placeholder="16-byte Tag in hex"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Decryption Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Decryption Key (64 Hex Characters)
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useMasterKeyForDecrypt}
                      onChange={(e) => setUseMasterKeyForDecrypt(e.target.checked)}
                      className="rounded text-royal"
                    />
                    <span>Use Vault Master Key</span>
                  </label>
                </div>
                <input
                  type="text"
                  disabled={useMasterKeyForDecrypt}
                  value={useMasterKeyForDecrypt ? '[VAULT_SYSTEM_MASTER_KEY_PROTECTED]' : decryptionKey}
                  onChange={(e) => setDecryptionKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
                  placeholder="Enter 64-character hex key..."
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={decryptLoading || (decryptMode === 'file' && !decryptFile)}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-royal hover:bg-royal-600 disabled:opacity-50 shadow-card hover:shadow-glow transition-all flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                {decryptLoading ? 'Authenticating & Decrypting...' : 'Decrypt with AES-256-GCM'}
              </button>
            </form>
          </div>

          {/* Decryption Result Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Restored Decrypted Output
                </h3>
                <p className="text-xs text-slate-400">Authenticated plaintext or original document payload.</p>
              </div>

              {decryptedResult && (
                <div className="flex items-center gap-2">
                  {decryptedResult.isText && decryptedResult.plaintext && (
                    <button
                      onClick={() => copyToClipboard(decryptedResult.plaintext!, 'decrypted')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-royal bg-royal-50 dark:bg-royal-950 hover:bg-royal-100 transition-colors"
                    >
                      {copiedField === 'decrypted' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'decrypted' ? 'Copied' : 'Copy Text'}
                    </button>
                  )}

                  <button
                    onClick={handleDownloadDecryptedFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Restored File
                  </button>
                </div>
              )}
            </div>

            {decryptedResult ? (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>
                    Cryptographic Authentication Successful! Original content restored. Size: {decryptedResult.size} bytes.
                  </span>
                </div>

                {decryptedResult.isText && decryptedResult.plaintext ? (
                  <div className="min-h-[220px] max-h-80 overflow-y-auto rounded-2xl bg-slate-50 dark:bg-navy-950 p-4 border border-slate-200 dark:border-navy-800">
                    <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                      {decryptedResult.plaintext}
                    </pre>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center space-y-3">
                    <FileCode className="w-12 h-12 text-royal mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Binary File Restored ({decryptedResult.filename})
                    </h4>
                    <p className="text-xs text-slate-400">
                      Decrypted binary document ({decryptedResult.mimeType}, {decryptedResult.size} bytes). Click "Download Restored File" to save to your device.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-72 border-2 border-dashed border-slate-200 dark:border-navy-800 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                <Unlock className="w-10 h-10 text-slate-300 dark:text-navy-700" />
                <p className="text-xs font-medium">Ready for decryption</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Supply ciphertext along with the correct 256-bit key and authentication tag to restore the plaintext.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: KEY MANAGEMENT & VAULT TELEMETRY */}
      {/* ============================================================== */}
      {activeTab === 'keys' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Vault Key Management & Cryptographic Telemetry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure hardware parameters, key derivation factors, and envelope encryption status.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Primary Master Key
              </span>
              <span className="font-mono text-xs font-bold text-royal mt-1 block">
                {keyInfo?.masterKeyFingerprint || 'SHA256:4c7a8b9d...[ACTIVE]'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Entropy: 256 bits</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                AEAD Mode
              </span>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                Galois/Counter Mode (GCM)
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Hardware Accelerated</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                IV Nonce Spec
              </span>
              <span className="font-mono text-xs font-bold text-accent mt-1 block">
                96-bit (12-byte) Unique CSPRNG
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Replay Protected</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Integrity Tag
              </span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                128-bit (16-byte) GHASH
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Tamper Rejecting</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-royal-50/50 dark:bg-royal-950/20 border border-royal-100 dark:border-royal-900/60 flex items-start gap-3">
            <Info className="w-5 h-5 text-royal flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white font-semibold">Envelope Encryption & Master Key Security:</strong>{' '}
              The master key is injected into the backend application memory strictly through environment variables and is never transmitted to web browsers. Raw disk files are completely illegible without authorized server decryption.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

