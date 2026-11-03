import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

function sign(payload: string) {
  const h = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${h}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf('.');
  if (idx < 0) return null;
  const payload = signed.slice(0, idx);
  const h = signed.slice(idx + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  if (h.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(h), Buffer.from(expected))) return null;
  return payload;
}

export function setSession(userId: number) {
  cookies().set('session', sign(String(userId)), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete('session');
}

export function getUserId(): number | null {
  const c = cookies().get('session')?.value;
  if (!c) return null;
  const p = unsign(c);
  if (!p) return null;
  
  const userId = Number(p);
  
  // Обновляем время последнего визита
  try {
    db.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?").run(userId);
  } catch (e) {}
  
  return userId;
}