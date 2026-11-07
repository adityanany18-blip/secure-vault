import app from './app';
import { config } from './config/environment';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🔐 SecureVault Enterprise Server Online`);
  console.log(`🚀 Port: ${PORT} | Environment: ${config.nodeEnv}`);
  console.log(`🛡️  Encryption: AES-256-GCM Hardware-Accelerated`);
  console.log(`🗄️  Database: Prisma ORM Active`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

