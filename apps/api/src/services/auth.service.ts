import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db, storesTable } from "../db";
import {
  createPasswordResetToken,
  createRefreshToken,
  createUser,
  findUserByEmail,
  findUserById,
  findValidPasswordResetToken,
  findValidRefreshToken,
  markPasswordResetTokenUsed,
  revokeRefreshToken,
  updateUserPassword,
} from "../repositories/auth.repository";

const SALT_ROUNDS = 10;

type AuthPayload = {
  id: string;
  email: string;
  storeId: string | null;
  isAdmin: boolean;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  return secret;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function createStoreForUser(userId: string, name: string) {
  const baseSlug = slugify(name) || "store";
  let finalSlug = baseSlug;
  let counter = 1;

  while (true) {
    const [existing] = await db.select().from(storesTable).where(eq(storesTable.slug, finalSlug)).limit(1);
    if (!existing) break;
    counter += 1;
    finalSlug = `${baseSlug}-${counter}`;
  }

  const [store] = await db
    .insert(storesTable)
    .values({
      id: randomUUID(),
      userId,
      name: `${name}'s Store`,
      slug: finalSlug,
    })
    .returning();

  return store;
}

export function generateToken(payload: AuthPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthPayload;
}

function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function issueRefreshToken(userId: string) {
  const raw = randomBytes(48).toString("hex");
  const tokenHash = hashOpaqueToken(raw);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await createRefreshToken(userId, tokenHash, expiresAt);
  return raw;
}

export async function register(name: string, email: string, password: string) {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Email already exists");

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ name, email, password: hashed });
  const store = await createStoreForUser(user.id, name);

  const token = generateToken({
    id: user.id,
    email: user.email,
    storeId: store.id,
    isAdmin: user.plan === "admin",
  });
  const refreshToken = await issueRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      storeId: store.id,
    },
    token,
    refreshToken,
  };
}

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Invalid email or password");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("Invalid email or password");

  const userWithStore = await findUserById(user.id);
  const token = generateToken({
    id: user.id,
    email: user.email,
    storeId: userWithStore?.storeId ?? null,
    isAdmin: user.plan === "admin",
  });
  const refreshToken = await issueRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      storeId: userWithStore?.storeId ?? null,
    },
    token,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const tokenHash = hashOpaqueToken(refreshToken);
  const tokenRow = await findValidRefreshToken(tokenHash);
  if (!tokenRow) throw new Error("Invalid refresh token");

  const user = await findUserById(tokenRow.userId);
  if (!user) throw new Error("User not found");

  await revokeRefreshToken(tokenRow.id);
  const nextRefreshToken = await issueRefreshToken(user.id);
  const accessToken = generateToken({
    id: user.id,
    email: user.email,
    storeId: user.storeId ?? null,
    isAdmin: user.plan === "admin",
  });

  return {
    token: accessToken,
    refreshToken: nextRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      storeId: user.storeId ?? null,
    },
  };
}

export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return { ok: true as const };

  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashOpaqueToken(raw);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await createPasswordResetToken(user.id, tokenHash, expiresAt);

  // In production this should be delivered via email/SMS provider.
  return { ok: true as const, resetToken: raw };
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashOpaqueToken(token);
  const resetRow = await findValidPasswordResetToken(tokenHash);
  if (!resetRow) throw new Error("Invalid or expired reset token");

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await updateUserPassword(resetRow.userId, hashed);
  await markPasswordResetTokenUsed(resetRow.id);

  return { ok: true as const };
}

