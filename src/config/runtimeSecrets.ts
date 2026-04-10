import logger from './logger';
import { getJsonSecretValue } from '../integrations/secretsManager';

function getOptionalEnvVar(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : undefined;
}

function getRequiredEnvVar(key: string): string {
  const value = getOptionalEnvVar(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getFirstStringValue(
  secret: Record<string, unknown>,
  candidateKeys: string[]
): string | undefined {
  for (const key of candidateKeys) {
    const value = secret[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function buildPostgresDatabaseUrl(params: {
  username: string;
  password: string;
  host: string;
  port: string;
  database: string;
  sslmode?: string;
}): string {
  const passwordEncoded = encodeURIComponent(params.password);
  const sslModeSuffix = params.sslmode ? `?sslmode=${encodeURIComponent(params.sslmode)}` : '';
  return `postgresql://${params.username}:${passwordEncoded}@${params.host}:${params.port}/${params.database}${sslModeSuffix}`;
}

export async function loadRuntimeSecrets(): Promise<void> {
  const region = getOptionalEnvVar('AWS_REGION') || 'us-east-1';

  const dbSecretArn = getOptionalEnvVar('DB_SECRET_ARN');
  const appCoreSecretArn = getOptionalEnvVar('APP_CORE_SECRET_ARN');

  const shouldLoadDatabaseUrl = !getOptionalEnvVar('DATABASE_URL') && Boolean(dbSecretArn);
  const shouldLoadJwtSecret = !getOptionalEnvVar('JWT_SECRET') && Boolean(appCoreSecretArn);

  if (!shouldLoadDatabaseUrl && !shouldLoadJwtSecret) {
    return;
  }

  logger.info(
    {
      shouldLoadDatabaseUrl,
      shouldLoadJwtSecret,
      region,
    },
    'Loading runtime secrets'
  );

  if (shouldLoadDatabaseUrl && dbSecretArn) {
    const dbSecret = await getJsonSecretValue(dbSecretArn, region);

    const username = getFirstStringValue(dbSecret, ['username', 'user', 'db_user', 'DB_USER']);
    const password = getFirstStringValue(dbSecret, ['password', 'pass', 'db_password', 'DB_PASSWORD']);
    const databaseFromSecret = getFirstStringValue(dbSecret, ['dbname', 'database', 'db_name', 'DB_NAME']);
    const hostFromSecret = getFirstStringValue(dbSecret, ['host', 'hostname', 'endpoint', 'address']);
    const portFromSecret = getFirstStringValue(dbSecret, ['port']);

    const host = hostFromSecret || getRequiredEnvVar('RDS_ENDPOINT');
    const port = portFromSecret || getOptionalEnvVar('DB_PORT') || '5432';
    const database = databaseFromSecret || getOptionalEnvVar('DB_NAME') || 'ecoloop';
    const sslmode = getOptionalEnvVar('DB_SSLMODE') || 'require';

    if (!username || !password) {
      throw new Error(
        'DB secret is missing required fields. Expected at least "username" and "password" keys.'
      );
    }

    process.env.DATABASE_URL = buildPostgresDatabaseUrl({
      username,
      password,
      host,
      port,
      database,
      sslmode,
    });

    logger.info({ host, port, database }, 'DATABASE_URL constructed from Secrets Manager');
  }

  if (shouldLoadJwtSecret && appCoreSecretArn) {
    const appCoreSecret = await getJsonSecretValue(appCoreSecretArn, region);
    const jwtSecret =
      getFirstStringValue(appCoreSecret, ['jwt_secret', 'JWT_SECRET', 'jwtSecret', 'secret']) || '';

    if (!jwtSecret) {
      throw new Error(
        'App core secret is missing required JWT secret field (e.g., "jwt_secret").'
      );
    }

    process.env.JWT_SECRET = jwtSecret;
    logger.info('JWT_SECRET loaded from Secrets Manager');
  }
}

