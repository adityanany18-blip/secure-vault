import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { hash } from '@node-rs/argon2';
import prisma from '../src/config/db';
import { encryptionService } from '../src/services/EncryptionService';
import { config } from '../src/config/environment';

async function main() {
  console.log('🌱 Starting SecureVault enterprise database seed...');

  // Ensure storage vault folder exists
  await fs.mkdir(config.storageDir, { recursive: true });

  // Clear existing records
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.fileVersion.deleteMany();
  await prisma.file.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users with Argon2id passwords
  const adminPasswordHash = await hash('Admin@SecureVault2026!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const editorPasswordHash = await hash('Editor@SecureVault2026!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const viewerPasswordHash = await hash('Viewer@SecureVault2026!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Alexander Cross',
      email: 'admin@securevault.io',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const editor1 = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'editor1@securevault.io',
      passwordHash: editorPasswordHash,
      role: 'EDITOR',
      status: 'ACTIVE',
    },
  });

  const editor2 = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'editor2@securevault.io',
      passwordHash: editorPasswordHash,
      role: 'EDITOR',
      status: 'ACTIVE',
    },
  });

  const viewer1 = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'viewer1@securevault.io',
      passwordHash: viewerPasswordHash,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  const viewer2 = await prisma.user.create({
    data: {
      name: 'David Kim',
      email: 'viewer2@securevault.io',
      passwordHash: viewerPasswordHash,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seeded 5 Users (1 Admin, 2 Editors, 2 Viewers)');

  // Helper to encrypt and store a demo file
  async function createDemoFile(
    ownerId: string,
    originalName: string,
    mimeType: string,
    plainContent: string | Buffer,
    folder: string
  ) {
    const buffer = Buffer.isBuffer(plainContent) ? plainContent : Buffer.from(plainContent, 'utf-8');
    const encResult = await encryptionService.encrypt(buffer);
    const storageKey = `${uuidv4()}.enc`;
    const storagePath = path.join(config.storageDir, storageKey);

    await fs.writeFile(storagePath, encResult.encryptedBuffer);

    return prisma.file.create({
      data: {
        originalName,
        storageKey,
        mimeType,
        fileSize: buffer.length,
        ownerId,
        encryptionVersion: encResult.encryptionVersion,
        nonce: encResult.nonce,
        authenticationTag: encResult.authTag,
        folder,
      },
    });
  }

  // 2. Create Sample Encrypted Files
  const file1 = await createDemoFile(
    admin.id,
    'Enterprise_Security_Policy_2026.md',
    'text/markdown',
    `# SECUREVAULT ENTERPRISE SECURITY POLICY (2026)
## Confidential Organizational Document

### 1. Cryptographic Standards
All organizational assets must be stored at rest utilizing AES-256-GCM authenticated encryption.
Plaintext data is strictly prohibited from persistent disks.

### 2. Access Control Model
- Principle of Least Privilege applies to all members.
- Deny-by-default access policies govern all repository transactions.
- Zero-Trust session validation requires cryptographic token rotation.

### 3. Key Management
- Master keys must be derived from cryptographically sound PRNG with 256 bits of entropy.
- Initialization Vectors (Nonces) must never be reused with identical keys.`,
    'Compliance'
  );

  const file2 = await createDemoFile(
    editor1.id,
    'Q4_Financial_Audit_Summary.json',
    'application/json',
    JSON.stringify(
      {
        fiscalYear: 2026,
        quarter: 'Q4',
        revenue: '$14,250,000',
        operatingMargin: '38.4%',
        complianceStatus: '100% Certified',
        auditors: ['PricewaterhouseCoopers', 'Internal InfoSec Council'],
        confidentialityLevel: 'STRICT_INTERNAL_ONLY',
      },
      null,
      2
    ),
    'Finance'
  );

  const file3 = await createDemoFile(
    editor2.id,
    'ZeroTrust_Cloud_Architecture.txt',
    'text/plain',
    `SecureVault Architecture Blueprint
=================================
Components:
- Gateway: Express reverse-proxy with strict Helmet CSP & CORS
- Engine: AES-256-GCM symmetric cryptographic engine
- Database: Prisma relational schema with indexed permission matrix
- Storage: Encrypted blob repository with isolated disk identifiers

Threat Mitigation:
- Direct file link tampering: Prevented via internal UUID mapping
- Broken Object Level Authorization (BOLA): Prevented via AccessControlService
- Data tampering at rest: GCM authentication tag verification throws on bit alteration`,
    'Architecture'
  );

  const file4 = await createDemoFile(
    admin.id,
    'Board_Meeting_Minutes_Nov2026.txt',
    'text/plain',
    `CONFIDENTIAL BOARD MINUTES
Date: November 2026
Attendees: Executive Committee & Lead Architects

1. Approved global rollout of SecureVault v2.4.
2. Verified zero reported security vulnerabilities in external penetration audit.
3. Allocated $4.5M to continuous automated compliance and zero-knowledge storage research.`,
    'Executive'
  );

  console.log('✅ Seeded 4 Encrypted Vault Files with real AES-256-GCM encryption');

  // 3. Seed Granular Permissions
  // Give Elena (Viewer 1) READ & DOWNLOAD on Security Policy
  await prisma.permission.create({
    data: {
      userId: viewer1.id,
      fileId: file1.id,
      canRead: true,
      canDownload: true,
      canUpdate: false,
      canDelete: false,
      canShare: false,
      canManagePermissions: false,
    },
  });

  // Give David (Viewer 2) READ ONLY (canDownload: false) on ZeroTrust Architecture
  await prisma.permission.create({
    data: {
      userId: viewer2.id,
      fileId: file3.id,
      canRead: true,
      canDownload: false, // Testing viewer restricted download!
      canUpdate: false,
      canDelete: false,
      canShare: false,
      canManagePermissions: false,
    },
  });

  // Give Marcus (Editor 2) READ, DOWNLOAD, UPDATE on Financial Audit
  await prisma.permission.create({
    data: {
      userId: editor2.id,
      fileId: file2.id,
      canRead: true,
      canDownload: true,
      canUpdate: true,
      canDelete: false,
      canShare: true,
      canManagePermissions: false,
    },
  });

  console.log('✅ Seeded Granular ACL Permissions');

  // 4. Seed Audit Logs
  const auditEntries = [
    {
      actorId: admin.id,
      action: 'SYSTEM_INITIALIZATION',
      result: 'SUCCESS',
      metadata: JSON.stringify({ message: 'SecureVault platform initialized.' }),
      timestamp: new Date(Date.now() - 3600000 * 24 * 3),
    },
    {
      actorId: admin.id,
      action: 'USER_CREATED',
      targetUserId: editor1.id,
      result: 'SUCCESS',
      metadata: JSON.stringify({ createdRole: 'EDITOR', email: 'editor1@securevault.io' }),
      timestamp: new Date(Date.now() - 3600000 * 24 * 2),
    },
    {
      actorId: admin.id,
      action: 'FILE_UPLOAD',
      fileId: file1.id,
      result: 'SUCCESS',
      metadata: JSON.stringify({ filename: file1.originalName, encryption: 'AES-256-GCM' }),
      timestamp: new Date(Date.now() - 3600000 * 18),
    },
    {
      actorId: editor1.id,
      action: 'AUTH_LOGIN_SUCCESS',
      result: 'SUCCESS',
      metadata: JSON.stringify({ loginMethod: 'argon2id-verified' }),
      timestamp: new Date(Date.now() - 3600000 * 12),
    },
    {
      actorId: editor1.id,
      action: 'FILE_UPLOAD',
      fileId: file2.id,
      result: 'SUCCESS',
      metadata: JSON.stringify({ filename: file2.originalName }),
      timestamp: new Date(Date.now() - 3600000 * 10),
    },
    {
      actorId: viewer2.id,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      fileId: file4.id,
      result: 'DENIED',
      metadata: JSON.stringify({ reason: 'No explicit file permissions granted to this user.' }),
      timestamp: new Date(Date.now() - 3600000 * 4),
    },
    {
      actorId: admin.id,
      action: 'PERMISSION_GRANTED',
      fileId: file1.id,
      targetUserId: viewer1.id,
      result: 'SUCCESS',
      metadata: JSON.stringify({ canRead: true, canDownload: true }),
      timestamp: new Date(Date.now() - 3600000 * 2),
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }

  // 5. Seed In-App Notifications
  await prisma.notification.create({
    data: {
      userId: viewer1.id,
      title: 'New Document Shared',
      message: 'Alexander Cross shared "Enterprise_Security_Policy_2026.md" with you.',
      type: 'INFO',
      link: '/dashboard/files',
    },
  });

  await prisma.notification.create({
    data: {
      userId: editor2.id,
      title: 'Editor Access Granted',
      message: 'You have been granted edit rights on "Q4_Financial_Audit_Summary.json".',
      type: 'SUCCESS',
      link: '/dashboard/files',
    },
  });

  console.log('✅ Seeded Audit Trails and User Notifications');
  console.log('🚀 Database seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

