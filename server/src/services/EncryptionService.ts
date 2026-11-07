import crypto from 'crypto';
import {
  IDecryptionRequest,
  IEncryptionResult,
  IEncryptionService,
} from '../interfaces/IEncryptionService';
import { config } from '../config/environment';

export class EncryptionService implements IEncryptionService {
  private static instance: EncryptionService;
  private readonly masterKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12; // 96 bits standard recommended for AES-GCM
  private readonly usedNonces: Set<string> = new Set();

  constructor(masterKeyHex?: string) {
    const keyHex = masterKeyHex || config.encryptionMasterKey;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error(
        'Invalid master key length: Master key must be a 64-character hex string (32 bytes / 256 bits).'
      );
    }
    this.masterKey = Buffer.from(keyHex, 'hex');
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Generates a new 256-bit cryptographically secure master key in hex format.
   */
  public generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypts a plaintext Buffer using AES-256-GCM with a unique 96-bit nonce.
   * Can use the system master key or an Admin-provided custom 256-bit key.
   */
  public async encrypt(plainBuffer: Buffer, keyHex?: string): Promise<IEncryptionResult> {
    if (!plainBuffer || !Buffer.isBuffer(plainBuffer)) {
      throw new Error('Plaintext payload must be a valid Buffer.');
    }

    let activeKey: Buffer;
    if (keyHex) {
      if (keyHex.length !== 64) {
        throw new Error('Invalid key length: Custom key must be a 64-character hex string (32 bytes / 256 bits).');
      }
      activeKey = Buffer.from(keyHex, 'hex');
    } else {
      activeKey = this.masterKey;
    }

    // Generate unique cryptographic nonce
    let nonceBuffer: Buffer;
    let nonceHex: string;

    do {
      nonceBuffer = crypto.randomBytes(this.ivLength);
      nonceHex = nonceBuffer.toString('hex');
    } while (this.usedNonces.has(nonceHex));

    this.usedNonces.add(nonceHex);

    const cipher = crypto.createCipheriv(this.algorithm, activeKey, nonceBuffer);

    // Optional Additional Authenticated Data (AAD) can bind metadata
    cipher.setAAD(Buffer.from('SecureVault-AES256GCM-v1', 'utf8'));

    const encryptedData = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedBuffer: encryptedData,
      nonce: nonceHex,
      authTag: authTag.toString('hex'),
      encryptionVersion: 'v1-aes-256-gcm',
      keyHex: keyHex || undefined,
    };
  }

  /**
   * Decrypts an encrypted Buffer, authenticating against the GCM auth tag and nonce.
   * Throws a security exception if tampered or invalid.
   */
  public async decrypt(request: IDecryptionRequest): Promise<Buffer> {
    const { encryptedBuffer, nonce, authTag, keyHex } = request;

    if (!encryptedBuffer || !Buffer.isBuffer(encryptedBuffer)) {
      throw new Error('Ciphertext must be a valid Buffer.');
    }
    if (!nonce || nonce.length !== this.ivLength * 2) {
      throw new Error('Invalid nonce provided: Expected 24 hex characters (12 bytes).');
    }
    if (!authTag || authTag.length !== 32) {
      throw new Error('Invalid authentication tag provided: Expected 32 hex characters (16 bytes).');
    }

    let activeKey: Buffer;
    if (keyHex) {
      if (keyHex.length !== 64) {
        throw new Error('Invalid key length: Custom key must be a 64-character hex string (32 bytes / 256 bits).');
      }
      activeKey = Buffer.from(keyHex, 'hex');
    } else {
      activeKey = this.masterKey;
    }

    try {
      const nonceBuffer = Buffer.from(nonce, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, activeKey, nonceBuffer);
      decipher.setAAD(Buffer.from('SecureVault-AES256GCM-v1', 'utf8'));
      decipher.setAuthTag(authTagBuffer);

      const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
      return decrypted;
    } catch (error: any) {
      // AES-GCM automatically fails decipher.final() if any bit of cipher text, authTag, or nonce is altered
      throw new Error('Cryptographic authentication failed: Incorrect decryption key or corrupted ciphertext.');
    }
  }

  /**
   * Verifies the cryptographic integrity of an encrypted file without exposing plaintext.
   */
  public async verifyIntegrity(
    encryptedBuffer: Buffer,
    nonce: string,
    authTag: string,
    keyHex?: string
  ): Promise<boolean> {
    try {
      await this.decrypt({ encryptedBuffer, nonce, authTag, keyHex });
      return true;
    } catch {
      return false;
    }
  }
}

export const encryptionService = EncryptionService.getInstance();
