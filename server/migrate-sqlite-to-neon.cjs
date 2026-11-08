
const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('child_process');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

const pythonCode = `
import sqlite3, json, sys

db = sqlite3.connect(sys.argv[1])
db.row_factory = sqlite3.Row

tables = [
    'User', 'File', 'FileVersion', 'Permission',
    'AuditLog', 'Session', 'PasswordResetToken',
    'Notification'
]

data = {}
for table in tables:
    data[table] = [
        dict(row) for row in
        db.execute('SELECT * FROM "' + table + '"').fetchall()
    ]

print(json.dumps(data))
db.close()
`;

const dateFields = {
  User: ['createdAt', 'updatedAt'],
  File: ['createdAt', 'updatedAt'],
  FileVersion: ['createdAt'],
  Permission: ['createdAt', 'updatedAt'],
  AuditLog: ['timestamp'],
  Session: ['expiresAt', 'createdAt'],
  PasswordResetToken: ['expiresAt', 'usedAt', 'createdAt'],
  Notification: ['createdAt']
};

const booleanFields = {
  File: ['isDeleted'],
  Permission: [
    'canRead', 'canDownload', 'canUpdate',
    'canDelete', 'canShare', 'canManagePermissions'
  ],
  Notification: ['read']
};

const models = [
  ['User', 'user'],
  ['File', 'file'],
  ['FileVersion', 'fileVersion'],
  ['Permission', 'permission'],
  ['AuditLog', 'auditLog'],
  ['Session', 'session'],
  ['PasswordResetToken', 'passwordResetToken'],
  ['Notification', 'notification']
];

async function main() {
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');

  console.log('Reading original SQLite database...');

  const result = spawnSync(
    'python',
    ['-c', pythonCode, dbPath],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Python export failed');
  }

  const data = JSON.parse(result.stdout);

  for (const [table, model] of models) {
    const count = await prisma[model].count();
    if (count !== 0) {
      throw new Error(
        `Neon table ${table} is not empty. Import cancelled.`
      );
    }
  }

  console.log('Neon is empty. Preparing records...');

  for (const table of Object.keys(data)) {
    for (const row of data[table]) {
      for (const field of dateFields[table] || []) {
        if (row[field] !== null && row[field] !== undefined) {
          row[field] = new Date(Number(row[field]));
          if (Number.isNaN(row[field].getTime())) {
            throw new Error(`Invalid date in ${table}.${field}`);
          }
        }
      }

      for (const field of booleanFields[table] || []) {
        if (row[field] !== null && row[field] !== undefined) {
          row[field] = Boolean(row[field]);
        }
      }
    }
  }

  console.log('Starting transactional import...');

  await prisma.$transaction(async (tx) => {
    for (const [table, model] of models) {
      const rows = data[table];

      if (rows.length > 0) {
        await tx[model].createMany({ data: rows });
      }

      console.log(`${table}: ${rows.length} imported`);
    }
  }, { maxWait: 10000, timeout: 120000 });

  console.log('\nVerifying imported records...');

  let total = 0;

  for (const [table, model] of models) {
    const count = await prisma[model].count();
    const expected = data[table].length;

    console.log(`${table}: ${count}/${expected}`);

    if (count !== expected) {
      throw new Error(`Count mismatch in ${table}`);
    }

    total += count;
  }

  console.log(`\nSUCCESS: ${total} records imported and verified.`);
}

main()
  .catch((error) => {
    console.error('\nIMPORT FAILED:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
