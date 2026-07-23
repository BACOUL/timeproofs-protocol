import { generateKeyPairSync } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

async function writePrivateJson(path, value) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  await chmod(path, 0o600);
}

export async function loadOrCreateRelayKey(keyPath) {
  try {
    const stored = JSON.parse(await readFile(keyPath, 'utf8'));
    if (stored.algorithm !== 'Ed25519' || !stored.private_key_pem || !stored.public_key_pem || !stored.key_id) {
      throw new Error('RELAY_KEY_FILE_INVALID');
    }
    return stored;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const createdAt = new Date().toISOString();
  const stored = {
    key_id: 'relay-ed25519-01',
    algorithm: 'Ed25519',
    created_at: createdAt,
    private_key_pem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    public_key_pem: publicKey.export({ type: 'spki', format: 'pem' })
  };
  await writePrivateJson(keyPath, stored);
  return stored;
}
