"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, MessageCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STORE_NAME, WHATSAPP } from "@/lib/constants";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-xl shadow-zinc-200/40"
        >
          {/* Logo + Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 inline-flex items-center justify-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
              </div>
            </motion.div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              {STORE_NAME || "Storezen"}
              <span className="text-emerald-600">PK</span>
            </h1>
            <h2 className="mt-3 text-xl font-bold text-zinc-900">Welcome back</h2>
            <p className="mt-1.5 text-sm text-zinc-500">Sign in to manage your account and orders</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                className="mt-1.5 h-12 rounded-xl"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Password
                </label>
                <button type="button" className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="h-12 rounded-xl pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="h-12 w-full rounded-xl text-[15px] font-bold gap-2 shadow-lg shadow-zinc-900/10"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="relative mt-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-zinc-400">or continue with</span>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {WHATSAPP ? (
              <a
                href={`https://wa.me/${WHATSAPP}`}
                className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 px-5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-500/20"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2} />
                Continue with WhatsApp
              </a>
            ) : (
              <div className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-5 text-sm font-medium text-zinc-400">
                <MessageCircle className="h-5 w-5" strokeWidth={2} />
                WhatsApp not configured
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            No account yet?{" "}
            <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Create one free
            </Link>
          </p>
        </motion.div>

        {/* Trust footer */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            Secure login
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Data protected
          </span>
        </div>
      </div>
    </div>
  );
}
