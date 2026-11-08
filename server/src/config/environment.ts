import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback-super-secret-jwt-key-2026-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionMasterKey:
    process.env.ENCRYPTION_MASTER_KEY ||
    '4c7a8b9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR || './storage/vault'),
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || '26214400', 10), // 25 MB
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-securevault-2026',
};

if (config.nodeEnv === 'production') {
  if (config.jwtSecret === 'fallback-super-secret-jwt-key-2026-production') {
    console.warn(
      '[SECURITY WARNING] Production environment detected with default fallback JWT_SECRET. Please set JWT_SECRET in environment variables.'
    );
  }
  if (config.cookieSecret === 'cookie-secret-securevault-2026') {
    console.warn(
      '[SECURITY WARNING] Production environment detected with default fallback COOKIE_SECRET. Please set COOKIE_SECRET in environment variables.'
    );
  }
}

