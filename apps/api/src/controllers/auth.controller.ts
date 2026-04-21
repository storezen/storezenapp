import { type Request, type Response } from "express";
import { findUserById } from "../repositories/auth.repository";
import {
  login,
  refreshAccessToken,
  register,
  requestPasswordReset,
  resetPassword,
} from "../services/auth.service";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

export async function registerController(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
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
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
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
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
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
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
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
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const result = await requestPasswordReset(parsed.data.email.toLowerCase());
    return res.json(result);
  } catch {
    return res.status(500).json({ error: "Failed to start password reset" });
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const result = await resetPassword(parsed.data.token, parsed.data.newPassword);
    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reset password";
    if (msg === "Invalid or expired reset token") return res.status(400).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

