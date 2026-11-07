import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { encryptionService, EncryptionService } from '../services/EncryptionService';
import { authenticationService } from '../services/AuthenticationService';
import { accessControlService } from '../services/AccessControlService';
import { fileManager } from '../services/FileManager';
import prisma from '../config/db';
import { UserFactory } from '../classes/UserFactory';
import { Admin } from '../classes/Admin';
import { Editor } from '../classes/Editor';
import { Viewer } from '../classes/Viewer';

describe('SecureVault Enterprise System Test Suite', () => {
  let testAdmin: any;
  let testEditor: any;
  let testViewer: any;
  let testFile: any;

  beforeAll(async () => {
    testAdmin = await prisma.user.findUnique({ where: { email: 'admin@securevault.io' } });
    testEditor = await prisma.user.findUnique({ where: { email: 'editor1@securevault.io' } });
    testViewer = await prisma.user.findUnique({ where: { email: 'viewer1@securevault.io' } });
    testFile = await prisma.file.findFirst({ where: { originalName: 'Enterprise_Security_Policy_2026.md' } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // 1. CRYPTOGRAPHIC ENCRYPTION TESTS
  // ==========================================
  describe('AES-256-GCM Encryption Engine', () => {
    it('should successfully encrypt and decrypt plaintext data', async () => {
      const plaintext = Buffer.from('Highly confidential corporate board minutes 2026.');
      const encResult = await encryptionService.encrypt(plaintext);

      expect(encResult.encryptedBuffer).toBeDefined();
      expect(encResult.nonce).toHaveLength(24); // 12 bytes in hex = 24 chars
      expect(encResult.authTag).toHaveLength(32); // 16 bytes in hex = 32 chars
      expect(encResult.encryptionVersion).toBe('v1-aes-256-gcm');

      const decrypted = await encryptionService.decrypt({
        encryptedBuffer: encResult.encryptedBuffer,
        nonce: encResult.nonce,
        authTag: encResult.authTag,
      });

      expect(decrypted.toString('utf8')).toBe(plaintext.toString('utf8'));
    });

    it('should generate a unique nonce for every distinct encryption call', async () => {
      const data = Buffer.from('Identical payload');
      const enc1 = await encryptionService.encrypt(data);
      const enc2 = await encryptionService.encrypt(data);

      expect(enc1.nonce).not.toBe(enc2.nonce);
      expect(enc1.encryptedBuffer).not.toEqual(enc2.encryptedBuffer);
    });

    it('should reject tampered ciphertext with a cryptographic authentication exception', async () => {
      const plaintext = Buffer.from('Immutable compliance archive.');
      const encResult = await encryptionService.encrypt(plaintext);

      // Flip a bit in the ciphertext
      const tamperedBuffer = Buffer.from(encResult.encryptedBuffer);
      tamperedBuffer[0] ^= 0x01;

      await expect(
        encryptionService.decrypt({
          encryptedBuffer: tamperedBuffer,
          nonce: encResult.nonce,
          authTag: encResult.authTag,
        })
      ).rejects.toThrow(/Cryptographic authentication failed/);
    });

    it('should reject invalid or forged authentication tags', async () => {
      const plaintext = Buffer.from('Financial ledger entry.');
      const encResult = await encryptionService.encrypt(plaintext);

      // Forge authentication tag
      const forgedTag = crypto.randomBytes(16).toString('hex');

      await expect(
        encryptionService.decrypt({
          encryptedBuffer: encResult.encryptedBuffer,
          nonce: encResult.nonce,
          authTag: forgedTag,
        })
      ).rejects.toThrow(/Cryptographic authentication failed/);
    });
  });

  // ==========================================
  // 2. OOP HIERARCHY & POLYMORPHISM TESTS
  // ==========================================
  describe('OOP Role Hierarchy & Polymorphism', () => {
    it('should properly instantiate polymorphic User subclasses', () => {
      const adminObj = UserFactory.fromPrisma(testAdmin);
      const editorObj = UserFactory.fromPrisma(testEditor);
      const viewerObj = UserFactory.fromPrisma(testViewer);

      expect(adminObj).toBeInstanceOf(Admin);
      expect(editorObj).toBeInstanceOf(Editor);
      expect(viewerObj).toBeInstanceOf(Viewer);

      expect(adminObj.canManageUsers()).toBe(true);
      expect(editorObj.canManageUsers()).toBe(false);
      expect(viewerObj.canManageUsers()).toBe(false);

      expect(adminObj.canUploadFiles()).toBe(true);
      expect(editorObj.canUploadFiles()).toBe(true);
      expect(viewerObj.canUploadFiles()).toBe(false);
    });

    it('should enforce strict Viewer prohibitions against write operations', () => {
      const viewerObj = UserFactory.fromPrisma(testViewer);

      expect(viewerObj.canPerformRoleAction('READ')).toBe(true);
      expect(viewerObj.canPerformRoleAction('DOWNLOAD')).toBe(true);
      expect(viewerObj.canPerformRoleAction('UPLOAD')).toBe(false);
      expect(viewerObj.canPerformRoleAction('UPDATE')).toBe(false);
      expect(viewerObj.canPerformRoleAction('DELETE')).toBe(false);
      expect(viewerObj.canPerformRoleAction('SHARE')).toBe(false);
      expect(viewerObj.canPerformRoleAction('MANAGE_PERMISSIONS')).toBe(false);
      expect(viewerObj.canPerformRoleAction('MANAGE_USERS')).toBe(false);
    });
  });

  // ==========================================
  // 3. AUTHENTICATION & SECURITY TESTS
  // ==========================================
  describe('Authentication & Session Management', () => {
    it('should verify correct password using Argon2id and reject incorrect password', async () => {
      const loginSuccess = await authenticationService.login({
        email: 'admin@securevault.io',
        password: 'Admin@SecureVault2026!',
      });
      expect(loginSuccess.token).toBeDefined();
      expect(loginSuccess.user.email).toBe('admin@securevault.io');

      await expect(
        authenticationService.login({
          email: 'admin@securevault.io',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Invalid email or password.');
    });

    it('should reject duplicate email registration', async () => {
      await expect(
        authenticationService.register({
          name: 'Imposter',
          email: 'admin@securevault.io',
          password: 'Password123!',
        })
      ).rejects.toThrow('An account with this email address already exists.');
    });

    it('should strictly assign VIEWER role upon public registration', async () => {
      const testEmail = `newuser_${Date.now()}@securevault.io`;
      const newUser = await authenticationService.register({
        name: 'New Registrant',
        email: testEmail,
        password: 'ValidPassword2026!',
      });

      expect(newUser.role).toBe('VIEWER');
    });
  });

  // ==========================================
  // 4. AUTHORIZATION & ACL TESTS (DENY-BY-DEFAULT)
  // ==========================================
  describe('Access Control Service (Deny-by-Default ACL)', () => {
    it('should grant Admin organizational access to any file', async () => {
      const evalResult = await accessControlService.evaluateFileAccess(
        testAdmin.id,
        testFile.id,
        'READ'
      );
      expect(evalResult.allowed).toBe(true);
      expect(evalResult.effectivePermissions.canRead).toBe(true);
      expect(evalResult.effectivePermissions.canDelete).toBe(true);
    });

    it('should allow Viewer 1 to read and download the permitted Security Policy', async () => {
      const readEval = await accessControlService.evaluateFileAccess(
        testViewer.id,
        testFile.id,
        'READ'
      );
      expect(readEval.allowed).toBe(true);

      const dlEval = await accessControlService.evaluateFileAccess(
        testViewer.id,
        testFile.id,
        'DOWNLOAD'
      );
      expect(dlEval.allowed).toBe(true);
    });

    it('should deny unauthorized user from accessing an unshared file', async () => {
      const viewer2 = await prisma.user.findUnique({ where: { email: 'viewer2@securevault.io' } });
      const evalResult = await accessControlService.evaluateFileAccess(
        viewer2!.id,
        testFile.id,
        'READ'
      );

      expect(evalResult.allowed).toBe(false);
      expect(evalResult.reason).toContain('No explicit file permissions');
    });

    it('should deny Viewer 2 from downloading when only read permission was granted', async () => {
      const viewer2 = await prisma.user.findUnique({ where: { email: 'viewer2@securevault.io' } });
      const archFile = await prisma.file.findFirst({ where: { originalName: 'ZeroTrust_Cloud_Architecture.txt' } });

      const readEval = await accessControlService.evaluateFileAccess(
        viewer2!.id,
        archFile!.id,
        'READ'
      );
      expect(readEval.allowed).toBe(true);

      const dlEval = await accessControlService.evaluateFileAccess(
        viewer2!.id,
        archFile!.id,
        'DOWNLOAD'
      );
      expect(dlEval.allowed).toBe(false);
      expect(dlEval.reason).toContain('Insufficient explicit permission');
    });
  });

  // ==========================================
  // 5. FILE MANAGEMENT & DECRYPTION FLOW
  // ==========================================
  describe('File Manager Decryption & Retrieval', () => {
    it('should stream and decrypt authorized file contents on the fly', async () => {
      const decrypted = await fileManager.getDecryptedFileStream(
        testAdmin.id,
        testFile.id,
        'READ'
      );

      expect(decrypted.filename).toBe('Enterprise_Security_Policy_2026.md');
      expect(decrypted.buffer.toString('utf-8')).toContain('SECUREVAULT ENTERPRISE SECURITY POLICY');
    });

    it('should deny unauthorized download stream request', async () => {
      const viewer2 = await prisma.user.findUnique({ where: { email: 'viewer2@securevault.io' } });

      await expect(
        fileManager.getDecryptedFileStream(viewer2!.id, testFile.id, 'DOWNLOAD')
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // 6. ADMIN-ONLY ENCRYPTION & DECRYPTION STUDIO
  // ==========================================
  describe('Admin-Only Encryption & Decryption System', () => {
    it('should allow Admin to encrypt with custom 256-bit key and decrypt accurately', async () => {
      const customKey = encryptionService.generateMasterKey();
      expect(customKey).toHaveLength(64);

      const plaintext = Buffer.from('Strictly confidential corporate strategy 2026.');
      const enc = await encryptionService.encrypt(plaintext, customKey);

      expect(enc.nonce).toHaveLength(24);
      expect(enc.authTag).toHaveLength(32);

      const dec = await encryptionService.decrypt({
        encryptedBuffer: enc.encryptedBuffer,
        nonce: enc.nonce,
        authTag: enc.authTag,
        keyHex: customKey,
      });

      expect(dec.toString('utf-8')).toBe(plaintext.toString('utf-8'));
    });

    it('should fail decryption when provided an incorrect decryption key', async () => {
      const correctKey = encryptionService.generateMasterKey();
      const wrongKey = encryptionService.generateMasterKey();

      const plaintext = Buffer.from('Sensitive executive compensation data.');
      const enc = await encryptionService.encrypt(plaintext, correctKey);

      await expect(
        encryptionService.decrypt({
          encryptedBuffer: enc.encryptedBuffer,
          nonce: enc.nonce,
          authTag: enc.authTag,
          keyHex: wrongKey,
        })
      ).rejects.toThrow(/Cryptographic authentication failed/);
    });

    it('should verify Admin has full permission while Editor and Viewer are strictly forbidden', () => {
      const adminObj = UserFactory.fromPrisma(testAdmin);
      const editorObj = UserFactory.fromPrisma(testEditor);
      const viewerObj = UserFactory.fromPrisma(testViewer);

      expect(adminObj.role).toBe('ADMIN');
      expect(editorObj.role).toBe('EDITOR');
      expect(viewerObj.role).toBe('VIEWER');

      // Admin has full systemic authority
      expect(adminObj.canPerformRoleAction('MANAGE_USERS')).toBe(true);
      expect(adminObj.canPerformRoleAction('MANAGE_PERMISSIONS')).toBe(true);

      // Non-admins forbidden from administrative modules
      expect(editorObj.canPerformRoleAction('MANAGE_USERS')).toBe(false);
      expect(viewerObj.canPerformRoleAction('MANAGE_USERS')).toBe(false);
      expect(viewerObj.canPerformRoleAction('UPLOAD')).toBe(false);
    });
  });
});

