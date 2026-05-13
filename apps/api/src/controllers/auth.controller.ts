import { type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { findUserById, updateUserById } from "../repositories/auth.repository";
import { db, usersTable } from "../db";
import {
  changePassword,
  login,
  refreshAccessToken,
  register,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "../services/auth.service";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validators/auth.validator";

export async function registerController(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { name, email, password } = parsed.data;

    const result = await register(name, email.toLowerCase(), password);
    return res.status(201).json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Registration failed";
    if (msg === "Email already exists") return res.status(409).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { email, password } = parsed.data;

    const result = await login(email.toLowerCase(), password);
    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Login failed";
    if (msg === "Invalid email or password") return res.status(401).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function adminLoginController(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const { email, password } = parsed.data;

    const result = await login(email.toLowerCase(), password);
    if (result.user.plan !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Admin login failed";
    if (msg === "Invalid email or password") return res.status(401).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function meController(req: Request, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to fetch current user" });
  }
}

export async function refreshController(req: Request, res: Response) {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const result = await refreshAccessToken(parsed.data.refreshToken);
    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to refresh token";
    if (msg === "Invalid refresh token") return res.status(401).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function forgotPasswordController(req: Request, res: Response) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const result = await requestPasswordReset(parsed.data.email.toLowerCase());
    return res.json(result);
  } catch {
    return res.status(500).json({ error: "Failed to start password reset" });
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }
    const result = await resetPassword(parsed.data.token, parsed.data.newPassword);
    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reset password";
    if (msg === "Invalid or expired reset token") return res.status(400).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function updateProfileController(req: Request, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }

    const result = await updateProfile(req.user.id, {
      name: parsed.data.name,
      email: parsed.data.email?.toLowerCase(),
    });
    return res.json({ user: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update profile";
    if (msg === "Email already exists") return res.status(409).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function changePasswordController(req: Request, res: Response) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) { const issues = parsed.error.issues.map((i) => i.message).join(", "); return res.status(400).json({ error: issues }); }

    const result = await changePassword(req.user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to change password";
    if (msg === "Current password is incorrect") return res.status(400).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

