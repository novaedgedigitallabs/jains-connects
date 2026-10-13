import { createApp } from './app.js';
import { PrismaAdminStore } from './admin/store.js';
import { PrismaAuthStore } from './auth/store.js';
import { loadConfig } from './config/env.js';
import { createDatabase } from './db/database.js';
import { PrismaTempleDirectory } from './directories/temples.js';

const config = loadConfig();
const database = createDatabase(config.databaseUrl);
const authStore = new PrismaAuthStore(database.client);
const adminStore = new PrismaAdminStore(database.client);
const templeDirectory = new PrismaTempleDirectory(database.client);
const app = createApp(config, { database, authStore, adminStore, templeDirectory });

const server = app.listen(config.port, config.host, () => {
  console.info(
    JSON.stringify({
      level: 'info',
      event: 'api_started',
      host: config.host,
      port: config.port,
      environment: config.nodeEnv,
    }),
  );
});

async function shutdown(signal: string) {
  console.info(JSON.stringify({ level: 'info', event: 'api_shutdown_started', signal }));

  server.close(async () => {
    await database.disconnect();
    process.exit(0);
  });
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
