import { PrismaClient } from '@prisma/client';

export interface DatabaseHealth {
  check(): Promise<void>;
}

export interface DatabaseClient extends DatabaseHealth {
  client: PrismaClient;
  disconnect(): Promise<void>;
}

export function createDatabase(databaseUrl: string): DatabaseClient {
  const client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  return {
    client,
    async check() {
      await client.$queryRaw`SELECT 1`;
    },
    async disconnect() {
      await client.$disconnect();
    },
  };
}
