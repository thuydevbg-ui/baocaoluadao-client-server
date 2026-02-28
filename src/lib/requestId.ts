import { randomUUID } from 'node:crypto';

export function createRequestId(existing?: string | null) {
  return existing?.trim() || randomUUID();
}
