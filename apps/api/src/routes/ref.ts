import { eq, sql } from "drizzle-orm";
import { Router } from "express";
import { db, influencersTable } from "../db";

const router = Router();

router.get("/ref/:code", async (req, res) => {
  try {
    const code = String(req.params.code ?? "").trim().toUpperCase();
    if (!code) return res.redirect(302, "/");
    const [influencer] = await db.select().from(influencersTable).where(eq(influencersTable.refCode, code)).limit(1);
    if (!influencer) return res.redirect(302, "/");

    await db
      .update(influencersTable)
      .set({ totalClicks: sql`${influencersTable.totalClicks} + 1` })
      .where(eq(influencersTable.id, influencer.id));

    res.cookie("ref_code", influencer.refCode, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.redirect(302, "/");
  } catch {
    return res.redirect(302, "/");
  }
});

export default router;
