# 🔐 SecureVault — Enterprise Secure File Sharing & Access Control System

> Production-quality, enterprise document management platform that securely stores, manages, encrypts, and shares organizational files using **Object-Oriented Programming (OOP)**, inheritance, interfaces, and **Role-Based Access Control (RBAC)**.

---

## 🌟 Executive Overview & Key Differentiators

- **Hardware-Accelerated AES-256-GCM Encryption**: All documents are encrypted on the server before hitting persistent disk. Unique 96-bit (12-byte) initialization vectors (nonces) prevent replay attacks, while 128-bit authentication tags immediately reject any tampered ciphertext.
- **Argon2id Memory-Hard Password Hashing**: State-of-the-art credential protection (`m=19456, t=2, p=1`) verified using `@node-rs/argon2`.
- **Pure Object-Oriented Architecture**: Clean polymorphism using abstract base class `User` and specialized subclasses `Admin`, `Editor`, and `Viewer`. Interfaces define strict contracts (`IPermission`, `IFileOperations`, `IEncryptionService`, `IAccessControlService`).
- **Deny-by-Default Access Control**: Direct URL ID enumeration, broken object-level authorization (BOLA), and privilege escalation are blocked by combining role capabilities with explicit file-level ACL rules.
- **Real Database-Backed Telemetry**: No dummy dashboard stats or placeholder buttons. Real Recharts analytics, real immutable audit logs, real version history snapshots, and real in-app notifications.
- **Administrator Protection Safeguard**: Strict backend guard prevents demoting or deactivating the last remaining active administrator to prevent organizational lockout.

---

## 👥 Demo Accounts & Credentials

The database is pre-seeded with 5 realistic enterprise accounts and encrypted documents:

| Role | Name | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Alexander Cross | `admin@securevault.io` | `Admin@SecureVault2026!` | Global organizational access, user management, audit trails, full file ACL |
| **EDITOR** | Sarah Connor | `editor1@securevault.io` | `Editor@SecureVault2026!` | Uploads files, edits & renames owned files, shares authorized assets |
| **EDITOR** | Marcus Vance | `editor2@securevault.io` | `Editor@SecureVault2026!` | Edit & versioning permissions, collaborative sharing |
| **VIEWER** | Elena Rostova | `viewer1@securevault.io` | `Viewer@SecureVault2026!` | Read & Download permissions on permitted Security Policy |
| **VIEWER** | David Kim | `viewer2@securevault.io` | `Viewer@SecureVault2026!` | Read-Only (Preview permitted; Download blocked by policy) |

---

## 🏗️ Architecture & OOP Design

### 1. Class Hierarchy & Polymorphism

```
                     ┌────────────────────────┐
                     │   <<Abstract Class>>   │
                     │          User          │
                     └───────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────┴────────┐     ┌────────┴────────┐     ┌────────┴────────┐
│      Admin      │     │     Editor      │     │     Viewer      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ canManageUsers()│     │ canUploadFiles()│     │ canPerformRole()│
│ canDeleteFile() │     │ canModifyFile() │     │ (Read-Only)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2. Interfaces & Services

- `IEncryptionService` &rarr; `EncryptionService`: AES-256-GCM encryption, decryption, nonce generation, integrity verification.
- `IAuthenticationService` &rarr; `AuthenticationService`: Argon2id password hashing, JWT session token generation, password resets.
- `IFileOperations` &rarr; `FileManager`: Multi-part stream processing, disk vault isolation, metadata management, versioning.
- `IAccessControlService` &rarr; `AccessControlService`: Object-level ACL evaluation combining role capabilities and granular permissions (`READ`, `DOWNLOAD`, `UPDATE`, `DELETE`, `SHARE`, `MANAGE_PERMISSIONS`).
- `IAuditLogService` &rarr; `AuditLogService`: Tamper-evident ledger logging with metadata sanitization (redacting sensitive keys).
- `UserManagementService`: Administrative user lifecycle, role modification, last-admin lockout prevention.
- `NotificationService`: In-app event delivery with unread tracking and navigation deep-links.

---

## 🔐 Cryptographic Encryption Flow (AES-256-GCM)

```
[User Upload]
      │
      ▼
1. Multer memory buffer validation (MIME & Size check <= 25MB)
      │
      ▼
2. Actor authorization check via AccessControlService
      │
      ▼
3. Generate cryptographically random 96-bit (12-byte) Nonce
      │
      ▼
4. Cipher: AES-256-GCM + 256-bit Master Key + Nonce + AAD
      │
      ▼
5. Output: Encrypted Ciphertext Buffer + 128-bit Auth Tag
      │
      ├──> Stored to Disk: /storage/vault/{random-uuid}.enc
      └──> Stored to Database: (nonce, authTag, encryptionVersion, metadata)

[User Download / Preview]
      │
      ▼
1. Verify user's explicit ACL right ('canDownload' or 'canRead')
      │
      ▼
2. Read encrypted binary from private vault
      │
      ▼
3. Decipher: AES-256-GCM + Auth Tag + Nonce
      │
      ├──> If altered: Throws "Cryptographic authentication failed" (Integrity violation)
      └──> If authentic: Stream decrypted buffer with strict headers
```

---

## 📊 Database Schema (Prisma ORM)

- **`User`**: `id`, `name`, `email`, `passwordHash`, `role` (ADMIN, EDITOR, VIEWER), `status` (ACTIVE, INACTIVE, PENDING), `avatarUrl`, timestamps.
- **`File`**: `id`, `originalName`, `storageKey`, `mimeType`, `fileSize`, `ownerId`, `encryptionVersion`, `nonce`, `authenticationTag`, `folder`, `isDeleted`.
- **`FileVersion`**: `id`, `fileId`, `versionNumber`, `storageKey`, `fileSize`, `nonce`, `authenticationTag`, `encryptionVersion`, `uploadedById`, `createdAt`.
- **`Permission`**: `id`, `userId`, `fileId`, `canRead`, `canDownload`, `canUpdate`, `canDelete`, `canShare`, `canManagePermissions`. Unique on `[userId, fileId]`.
- **`AuditLog`**: `id`, `actorId`, `action`, `fileId`, `targetUserId`, `timestamp`, `result` (`SUCCESS`, `FAILURE`, `DENIED`), `metadata`, `ipAddress`, `userAgent`.
- **`Session`**: `id`, `userId`, `token`, `expiresAt`.
- **`PasswordResetToken`**: `id`, `userId`, `token`, `expiresAt`, `usedAt`.
- **`Notification`**: `id`, `userId`, `title`, `message`, `type`, `read`, `link`, `createdAt`.

> **Database Note**: The repository includes a zero-dependency SQLite database out-of-the-box (`dev.db`). Switching to PostgreSQL requires only updating `provider = "postgresql"` in `server/prisma/schema.prisma` and specifying your `DATABASE_URL="postgresql://user:pass@localhost:5432/securevault"`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18 (Tested on v24.22.1)
- npm >= 9

### 2. Installation
Dependencies are already installed. If running afresh:
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 3. Database Initialization & Seed
```bash
cd server
npm run prisma:push
npm run prisma:seed
```

### 4. Running the Automated Test Suite
```bash
cd server
npm run test
```
*Expected output: 15 passing tests across encryption tampering, Argon2id, deny-by-default authorization, and polymorphic subclasses.*

### 5. Running the Application
Open two terminal windows:

**Terminal 1 (Backend API on http://localhost:5000):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client on http://localhost:3000):**
```bash
cd client
npm run dev
```

Open `http://localhost:3000` in your web browser. You can click on any of the Quick Demo Account pills on the Login page to immediately test the platform as an Admin, Editor, or Viewer.

