import { and, eq, gt } from "drizzle-orm";
import { db, passwordResetTokensTable, refreshTokensTable, storesTable, usersTable } from "../db";

type NewUser = {
  name: string;
  email: string;
  password: string;
  plan?: string;
};

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  return user ?? null;
}

export async function createUser(data: NewUser) {
  const [user] = await db
    .insert(usersTable)
    .values({
      name: data.name,
      email: data.email,
      password: data.password,
      plan: data.plan ?? "free",
    })
    .returning();

  return user;
}

export async function findUserById(id: string) {
  const [row] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      plan: usersTable.plan,
      isActive: usersTable.isActive,
      storeId: storesTable.id,
    })
    .from(usersTable)
    .leftJoin(storesTable, eq(storesTable.userId, usersTable.id))
    .where(eq(usersTable.id, id))
    .limit(1);

  return row ?? null;
}

export async function createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
  const [row] = await db
    .insert(refreshTokensTable)
    .values({ userId, tokenHash, expiresAt })
    .returning();
  return row;
}

export async function findValidRefreshToken(tokenHash: string) {
  const [row] = await db
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.tokenHash, tokenHash),
        eq(refreshTokensTable.revoked, false),
        gt(refreshTokensTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function revokeRefreshToken(id: string) {
  await db
    .update(refreshTokensTable)
    .set({ revoked: true })
    .where(eq(refreshTokensTable.id, id));
}

export async function createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
  const [row] = await db
    .insert(passwordResetTokensTable)
    .values({ userId, tokenHash, expiresAt })
    .returning();
  return row;
}

export async function findValidPasswordResetToken(tokenHash: string) {
  const [row] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.tokenHash, tokenHash),
        eq(passwordResetTokensTable.used, false),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function markPasswordResetTokenUsed(id: string) {
  await db
    .update(passwordResetTokensTable)
    .set({ used: true })
    .where(eq(passwordResetTokensTable.id, id));
}

export async function updateUserPassword(userId: string, hashedPassword: string) {
  await db
    .update(usersTable)
    .set({ password: hashedPassword })
    .where(eq(usersTable.id, userId));
}

