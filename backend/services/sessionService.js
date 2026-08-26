import crypto from 'crypto';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { roleForIdentifier } from '../utils/roles.js';

export const SESSION_COOKIE_NAME = 'ueh_tcc_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// In-memory fallback session store
const MEMORY_SESSIONS = new Map();

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const parseCookies = (cookieHeader = '') => Object.fromEntries(
  cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex < 0) return [part, ''];
      return [
        decodeURIComponent(part.slice(0, separatorIndex)),
        decodeURIComponent(part.slice(separatorIndex + 1))
      ];
    })
);

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development',
  sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
  maxAge: SESSION_TTL_MS,
  path: '/'
});

export const publicUser = (user) => ({
  id: user.id || user._id?.toString(),
  uid: user.uid || null,
  username: user.username,
  email: user.username,
  name: user.name,
  role: roleForIdentifier(user.username),
  phoneNumber: user.phoneNumber || '',
  avatar: user.avatar || '',
  school: user.school || '',
  bio: user.bio || ''
});

export const issueSession = async (res, user) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const userId = user.id || user._id?.toString();
  const username = user.username;

  if (!userId || !username) {
    throw new Error('Cannot issue a session without a stable user identity');
  }

  // Always store in memory fallback
  MEMORY_SESSIONS.set(tokenHash, { userId, username, expiresAt, user: publicUser(user) });

  if (mongoose.connection.readyState === 1) {
    try {
      await Session.create({ tokenHash, userId, username, expiresAt });
    } catch {}
  }

  res.cookie(SESSION_COOKIE_NAME, token, cookieOptions());
  return token;
};

export const resolveSessionUser = async (req) => {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies[SESSION_COOKIE_NAME];
  
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return null;

  const tokenHash = hashToken(token);

  // Check memory session first
  const memSession = MEMORY_SESSIONS.get(tokenHash);
  if (memSession && new Date() < memSession.expiresAt) {
    return memSession.user;
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const session = await Session.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() }
      }).lean();

      if (session) {
        const user = await User.findOne({
          $or: [{ id: session.userId }, { username: session.username }]
        }).lean();

        if (user) {
          const pub = publicUser(user);
          MEMORY_SESSIONS.set(tokenHash, { ...session, user: pub });
          return pub;
        }
      }
    } catch {}
  }

  return null;
};

export const revokeSession = async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
    path: '/'
  });

  if (token) {
    const tokenHash = hashToken(token);
    MEMORY_SESSIONS.delete(tokenHash);
    if (mongoose.connection.readyState === 1) {
      try {
        await Session.deleteOne({ tokenHash });
      } catch {}
    }
  }
};
