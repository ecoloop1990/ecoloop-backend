import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import logger from '../config/logger';

export type SecretsManagerSecretValue = Record<string, unknown>;

function parseJsonSecret(secretString: string, secretId: string): SecretsManagerSecretValue {
  try {
    const parsed = JSON.parse(secretString) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Secret JSON must be an object');
    }
    return parsed as SecretsManagerSecretValue;
  } catch (error) {
    logger.error({ error, secretId }, 'Failed to parse Secrets Manager secret JSON');
    throw new Error(`Invalid JSON in Secrets Manager secret: ${secretId}`);
  }
}

export async function getJsonSecretValue(secretId: string, region: string): Promise<SecretsManagerSecretValue> {
  const client = new SecretsManagerClient({ region });

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    })
  );

  if (response.SecretString) {
    return parseJsonSecret(response.SecretString, secretId);
  }

  if (response.SecretBinary) {
    const decoded = Buffer.from(response.SecretBinary as Uint8Array).toString('utf-8');
    return parseJsonSecret(decoded, secretId);
  }

  throw new Error(`Secrets Manager secret has no SecretString/SecretBinary: ${secretId}`);
}
