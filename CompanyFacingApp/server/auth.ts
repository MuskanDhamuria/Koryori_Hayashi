import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';
import {
  cleanupExpiredSessions,
  createSessionRecord,
  createStoredUser,
  deleteSessionByTokenHash,
  findStoredUserByEmail,
  findUserByTokenHash,
  hasAnyUser,
} from './db.js';
import type { AuthUser } from '../src/types.js';

const SESSION_COOKIE = 'company_facing_session';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser | null;
    }
  }
}

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, 'hex');

  if (candidate.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidate, storedBuffer);
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function setSessionCookie(response: Response, token: string) {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: config.sessionDays * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
  });
}

function createSessionForUser(userId: string, response: Response) {
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.sessionDays * 24 * 60 * 60 * 1000);

  createSessionRecord({
    id: randomUUID(),
    userId,
    tokenHash: hashSessionToken(token),
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  setSessionCookie(response, token);
}

export function readSessionUser(request: Request): AuthUser | null {
  cleanupExpiredSessions();
  const token = request.cookies?.[SESSION_COOKIE];

  if (!token || typeof token !== 'string') {
    return null;
  }

  return findUserByTokenHash(hashSessionToken(token));
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const user = readSessionUser(request);

  if (!user) {
    clearSessionCookie(response);
    response.status(401).json({ ok: false, message: 'Please log in to continue.', data: null });
    return;
  }

  request.authUser = user;
  next();
}

export function buildSessionResponse(request: Request) {
  const user = readSessionUser(request);
  return {
    authenticated: Boolean(user),
    setupRequired: !hasAnyUser(),
    user,
  };
}

export function registerFirstUser(input: { name: string; email: string; password: string }, response: Response) {
  if (hasAnyUser()) {
    throw new Error('An account already exists. Please log in with that account.');
  }

  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const user = createStoredUser({
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  });

  createSessionForUser(user.id, response);
  return user;
}

export function loginUser(input: { email: string; password: string }, response: Response) {
  const storedUser = findStoredUserByEmail(input.email.trim().toLowerCase());

  if (!storedUser || !verifyPassword(input.password, storedUser.passwordHash)) {
    throw new Error('Invalid email or password.');
  }

  createSessionForUser(storedUser.id, response);
  return {
    id: storedUser.id,
    name: storedUser.name,
    email: storedUser.email,
    role: storedUser.role,
  } satisfies AuthUser;
}

export function logoutUser(request: Request, response: Response) {
  const token = request.cookies?.[SESSION_COOKIE];
  if (token && typeof token === 'string') {
    deleteSessionByTokenHash(hashSessionToken(token));
  }
  clearSessionCookie(response);
}
