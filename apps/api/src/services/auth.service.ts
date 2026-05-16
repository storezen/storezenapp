import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db, storesTable, usersTable, storeUsersTable, ROLES } from "@storepk/db";

type AuthPayload = {
  userId: string;
  email: string;
  storeId: string | null;
  role: "owner" | "admin" | "manager" | "viewer" | null;
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
  
  await db.insert(storeUsersTable).onConflictDoNothing().values({
    id: randomUUID(),
    userId,
    storeId: "system",
    role: "viewer",
    status: "active",
  }).catch(() => {});
  
  return raw;
}

export async function register(name: string, email: string, password: string) {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  
  if (existing) {
    throw new Error("Email already exists");
  }

  const hashed = await bcrypt.hash(password, 10);
  
  const [user] = await db
    .insert(usersTable)
    .values({
      id: randomUUID(),
      name,
      email,
      password: hashed,
    })
    .returning();

  // Create store
  const baseSlug = slugify(name) || "store";
  let finalSlug = baseSlug;
  let counter = 1;

  while (true) {
    const [existingStore] = await db
      .select()
      .from(storesTable)
      .where(eq(storesTable.slug, finalSlug))
      .limit(1);
    if (!existingStore) break;
    counter += 1;
    finalSlug = `${baseSlug}-${counter}`;
  }

  const [store] = await db
    .insert(storesTable)
    .values({
      id: randomUUID(),
      name: `${name}'s Store`,
      slug: finalSlug,
      plan: "free",
      status: "active",
    })
    .returning();

  // Link user to store as owner
  await db.insert(storeUsersTable).values({
    id: randomUUID(),
    userId: user.id,
    storeId: store.id,
    role: ROLES.OWNER,
    status: "active",
    joinedAt: new Date(),
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    storeId: store.id,
    role: "owner",
  });

  const refreshToken = await issueRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      storeId: store.id,
      storeSlug: store.slug,
      role: "owner",
    },
    token,
    refreshToken,
  };
}

export async function login(email: string, password: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new Error("Invalid email or password");
  }

  // Get user's first active store
  const [storeUser] = await db
    .select()
    .from(storeUsersTable)
    .where(eq(storeUsersTable.userId, user.id))
    .where(eq(storeUsersTable.status, "active"))
    .orderBy(storeUsersTable.joinedAt)
    .limit(1);

  const storeId = storeUser?.storeId || null;
  const role = storeUser?.role || null;

  const token = generateToken({
    userId: user.id,
    email: user.email,
    storeId,
    role: role as AuthPayload["role"],
  });

  const refreshToken = await issueRefreshToken(user.id);

  let storeSlug = null;
  if (storeId) {
    const [store] = await db.select().from(storesTable).where(eq(storesTable.id, storeId)).limit(1);
    storeSlug = store?.slug || null;
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      storeId,
      storeSlug,
      role,
    },
    token,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const tokenHash = hashOpaqueToken(refreshToken);
  
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, "system")) // Placeholder
    .limit(1);
    
  if (!user) {
    throw new Error("Invalid refresh token");
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    storeId: null,
    role: null,
  });

  return { token, refreshToken };
}
