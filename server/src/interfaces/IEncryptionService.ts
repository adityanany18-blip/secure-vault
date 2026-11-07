export interface IEncryptionResult {
  encryptedBuffer: Buffer;
  nonce: string; // Hex representation of initialization vector
  authTag: string; // Hex representation of GCM authentication tag
  encryptionVersion: string;
  keyHex?: string;
}

export interface IDecryptionRequest {
  encryptedBuffer: Buffer;
  nonce: string;
  authTag: string;
  encryptionVersion?: string;
  keyHex?: string;
}

export interface IEncryptionService {
  encrypt(plainBuffer: Buffer, keyHex?: string): Promise<IEncryptionResult>;
  decrypt(request: IDecryptionRequest): Promise<Buffer>;
  verifyIntegrity(
    encryptedBuffer: Buffer,
    nonce: string,
    authTag: string,
    keyHex?: string
  ): Promise<boolean>;
  generateMasterKey(): string;
}
