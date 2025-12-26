const SECRET = 'homebank-2024';

interface QRPayload {
  v: number;
  id: string;
  sig: string;
}

function generateChecksum(id: string): string {
  const str = id + SECRET;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

export function encodeQR(userId: string): string {
  const sig = generateChecksum(userId);
  const payload: QRPayload = { v: 1, id: userId, sig };
  return JSON.stringify(payload);
}

export function decodeQR(data: string): string | null {
  try {
    const payload: QRPayload = JSON.parse(data);
    if (payload.v !== 1) return null;
    if (!payload.id || typeof payload.id !== 'string') return null;
    if (generateChecksum(payload.id) !== payload.sig) return null;
    return payload.id;
  } catch {
    return null;
  }
}
