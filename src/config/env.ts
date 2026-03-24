interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  BASE_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  AWS_REGION: string;
  S3_BUCKET_NAME: string;
  AI_SERVICE_URL: string;
  AI_SERVICE_TIMEOUT: number;
  LOG_LEVEL: string;
  CORS_ORIGIN: string;
  FRONTEND_URL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  RDS_ENDPOINT: string;
}

const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvNumber = (key: string): number => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }

  return parsed;
};

export const env: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV'),
  PORT: getEnvNumber('PORT'),
  API_VERSION: getEnvVar('API_VERSION'),
  BASE_URL: getEnvVar('BASE_URL'),
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN'),
  AWS_REGION: getEnvVar('AWS_REGION'),
  S3_BUCKET_NAME: getEnvVar('S3_BUCKET_NAME'),
  AI_SERVICE_URL: getEnvVar('AI_SERVICE_URL'),
  AI_SERVICE_TIMEOUT: getEnvNumber('AI_SERVICE_TIMEOUT'),
  LOG_LEVEL: getEnvVar('LOG_LEVEL'),
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN'),
  FRONTEND_URL: getEnvVar('FRONTEND_URL'),
  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS'),
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS'),
  RDS_ENDPOINT: getEnvVar('RDS_ENDPOINT'),
};

