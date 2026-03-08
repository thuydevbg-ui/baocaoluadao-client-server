import crypto from 'crypto';

const PREFIX = 'enc:v1:';

function getKeyMaterial(): string {
  return (
    process.env.SETTINGS_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_COOKIE_SECRET ||
    ''
  );
}

function getKey(): Buffer {
  const material = getKeyMaterial();
  if (!material) {
    throw new Error('Missing encryption key. Set SETTINGS_ENCRYPTION_KEY (recommended) or NEXTAUTH_SECRET.');
  }
  return crypto.createHash('sha256').update(material).digest();
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(PREFIX));
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
}

export function decryptSecret(payload: string): string {
  if (!payload.startsWith(PREFIX)) return payload;
  const key = getKey();
  const encoded = payload.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = encoded.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString('utf8');
}

