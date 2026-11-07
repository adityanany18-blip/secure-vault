import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { encryptionService } from '../services/EncryptionService';
import { auditLogService } from '../services/AuditLogService';
import { fileManager } from '../services/FileManager';
import prisma from '../config/db';
import { config } from '../config/environment';

export const generateKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = encryptionService.generateMasterKey();
    res.status(200).json({
      success: true,
      data: {
        key,
        lengthBits: 256,
        format: 'hex (64 characters)',
        algorithm: 'AES-256-GCM',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const encryptData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { plaintext, keyHex, originalName, folder, saveToVault } = req.body;
    let bufferToEncrypt: Buffer;
    let filename = originalName || 'encrypted_document.txt';
    let mimeType = 'text/plain';

    if (req.file) {
      bufferToEncrypt = req.file.buffer;
      filename = req.file.originalname;
      mimeType = req.file.mimetype;
    } else if (plaintext !== undefined && plaintext !== null) {
      bufferToEncrypt = Buffer.from(plaintext, 'utf-8');
    } else {
      res.status(400).json({
        success: false,
        message: 'Either plaintext or an uploaded document file is required.',
      });
      return;
    }

    const cleanKeyHex = keyHex && keyHex.trim() ? keyHex.trim() : undefined;
    if (cleanKeyHex && cleanKeyHex.length !== 64) {
      res.status(400).json({
        success: false,
        message: 'Invalid key length: Custom key must be exactly 64 hex characters (32 bytes / 256 bits).',
      });
      return;
    }

    const encResult = await encryptionService.encrypt(bufferToEncrypt, cleanKeyHex);

    // Create an interoperable JSON bundle
    const bundle = {
      version: encResult.encryptionVersion,
      algorithm: 'AES-256-GCM',
      nonce: encResult.nonce,
      authTag: encResult.authTag,
      ciphertext: encResult.encryptedBuffer.toString('base64'),
      originalName: filename,
      mimeType,
      size: bufferToEncrypt.length,
      createdAt: new Date().toISOString(),
    };

    let vaultFile = null;
    if (saveToVault === 'true' || saveToVault === true) {
      vaultFile = await fileManager.uploadFile(
        req.user!.id,
        {
          originalname: filename,
          mimetype: mimeType,
          buffer: bufferToEncrypt,
          size: bufferToEncrypt.length,
        },
        folder || 'Compliance'
      );
    }

    await auditLogService.log({
      actorId: req.user!.id,
      action: 'CRYPTO_ENCRYPT_OPERATION',
      result: 'SUCCESS',
      metadata: {
        filename,
        originalSize: bufferToEncrypt.length,
        encryptedSize: encResult.encryptedBuffer.length,
        usedCustomKey: !!cleanKeyHex,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payload successfully encrypted with AES-256-GCM.',
      data: {
        algorithm: 'AES-256-GCM',
        ciphertextBase64: bundle.ciphertext,
        ciphertextHex: encResult.encryptedBuffer.toString('hex'),
        nonce: encResult.nonce,
        authTag: encResult.authTag,
        keyUsed: cleanKeyHex ? cleanKeyHex : '[VAULT_SYSTEM_MASTER_KEY]',
        originalName: filename,
        originalSize: bufferToEncrypt.length,
        encryptedSize: encResult.encryptedBuffer.length,
        bundleJson: JSON.stringify(bundle, null, 2),
        vaultFile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const decryptData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let ciphertextBase64 = req.body.ciphertext;
    let nonce = req.body.nonce;
    let authTag = req.body.authTag;
    let keyHex = req.body.keyHex && req.body.keyHex.trim() ? req.body.keyHex.trim() : undefined;
    let filename = 'decrypted_output.txt';
    let mimeType = 'text/plain';

    // If an encrypted file was uploaded
    if (req.file) {
      try {
        const fileContent = req.file.buffer.toString('utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.ciphertext && parsed.nonce && parsed.authTag) {
          ciphertextBase64 = parsed.ciphertext;
          nonce = parsed.nonce;
          authTag = parsed.authTag;
          if (parsed.originalName) filename = parsed.originalName;
          if (parsed.mimeType) mimeType = parsed.mimeType;
        } else {
          throw new Error('Invalid bundle');
        }
      } catch {
        res.status(400).json({
          success: false,
          message: 'The uploaded file must be a valid SecureVault encrypted JSON bundle (.enc or .json).',
        });
        return;
      }
    } else if (req.body.bundleJson) {
      try {
        const parsed = JSON.parse(req.body.bundleJson);
        ciphertextBase64 = parsed.ciphertext;
        nonce = parsed.nonce;
        authTag = parsed.authTag;
        if (parsed.originalName) filename = parsed.originalName;
        if (parsed.mimeType) mimeType = parsed.mimeType;
      } catch {
        res.status(400).json({
          success: false,
          message: 'Invalid bundle JSON format.',
        });
        return;
      }
    }

    if (!ciphertextBase64 || !nonce || !authTag) {
      res.status(400).json({
        success: false,
        message: 'Missing required cryptographic fields: ciphertext, nonce, and authTag are required.',
      });
      return;
    }

    if (keyHex && keyHex.length !== 64) {
      res.status(400).json({
        success: false,
        message: 'Invalid key length: Decryption key must be 64 hex characters (32 bytes / 256 bits).',
      });
      return;
    }

    let encryptedBuffer: Buffer;
    try {
      // Check if ciphertext is hex or base64
      if (/^[0-9a-fA-F]+$/.test(ciphertextBase64) && ciphertextBase64.length % 2 === 0) {
        encryptedBuffer = Buffer.from(ciphertextBase64, 'hex');
      } else {
        encryptedBuffer = Buffer.from(ciphertextBase64, 'base64');
      }
    } catch {
      res.status(400).json({
        success: false,
        message: 'Ciphertext encoding is invalid. Expected Base64 or Hex.',
      });
      return;
    }

    // Authenticate and decrypt with AES-256-GCM
    let decryptedBuffer: Buffer;
    try {
      decryptedBuffer = await encryptionService.decrypt({
        encryptedBuffer,
        nonce,
        authTag,
        keyHex,
      });
    } catch (cryptoErr: any) {
      await auditLogService.log({
        actorId: req.user!.id,
        action: 'CRYPTO_DECRYPT_FAILURE',
        result: 'FAILURE',
        metadata: { reason: cryptoErr.message, filename },
      });

      res.status(400).json({
        success: false,
        message: 'Decryption failed: Cryptographic authentication failed. The decryption key, nonce, or auth tag is incorrect, or the ciphertext has been tampered with.',
      });
      return;
    }

    // Check if output is human-readable UTF-8
    const isText = isUtf8(decryptedBuffer);
    const plaintext = isText ? decryptedBuffer.toString('utf-8') : undefined;

    await auditLogService.log({
      actorId: req.user!.id,
      action: 'CRYPTO_DECRYPT_OPERATION',
      result: 'SUCCESS',
      metadata: { filename, decryptedSize: decryptedBuffer.length },
    });

    res.status(200).json({
      success: true,
      message: 'Ciphertext successfully authenticated and decrypted with AES-256-GCM.',
      data: {
        plaintext,
        isText,
        filename,
        mimeType,
        size: decryptedBuffer.length,
        decryptedBase64: decryptedBuffer.toString('base64'),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getKeyManagementInfo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const masterKeyBuffer = Buffer.from(config.encryptionMasterKey, 'hex');
    const fingerprint = crypto.createHash('sha256').update(masterKeyBuffer).digest('hex').substring(0, 16);

    res.status(200).json({
      success: true,
      data: {
        algorithm: 'AES-256-GCM',
        keySizeBits: 256,
        keySizeBytes: 32,
        masterKeyFingerprint: `SHA256:${fingerprint}...[PROTECTED]`,
        nonceLengthBits: 96,
        authTagLengthBits: 128,
        kdf: 'Argon2id',
        status: 'Operational',
      },
    });
  } catch (error) {
    next(error);
  }
};

function isUtf8(buf: Buffer): boolean {
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    if (byte === 0) return false; // Null byte indicates binary
  }
  return true;
}

