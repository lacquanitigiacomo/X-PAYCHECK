import { z } from 'zod';

const serverEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default('x_paycheck_development'),
  DB_USER: z.string().default('x_paycheck_dev'),
  DB_PASSWORD: z.string().optional(),
});

export interface ServerConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  jwtSecret: string;
  databaseUrl?: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password?: string;
  };
}

export function loadServerConfig(environment: NodeJS.ProcessEnv): ServerConfig {
  const parsed = serverEnvironmentSchema.parse(environment);
  if (parsed.NODE_ENV === 'production' && !parsed.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
  }
  if (parsed.NODE_ENV === 'production' && !parsed.DATABASE_URL && !parsed.DB_PASSWORD) {
    throw new Error('DATABASE_URL or DB_PASSWORD is required in production');
  }

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    jwtSecret: parsed.JWT_SECRET ?? 'x-paycheck-local-development-only',
    databaseUrl: parsed.DATABASE_URL,
    database: {
      host: parsed.DB_HOST,
      port: parsed.DB_PORT,
      name: parsed.DB_NAME,
      user: parsed.DB_USER,
      password: parsed.DB_PASSWORD,
    },
  };
}
