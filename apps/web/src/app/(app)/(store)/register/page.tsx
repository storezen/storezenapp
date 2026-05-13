"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STORE_NAME } from "@/lib/constants";

export default function RegisterPage() {
  const { register: doRegister } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await doRegister(name, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const perks = [
    "Track your orders easily",
    "Faster checkout",
    "Order history & wishlist",
  ];

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
              {STORE_NAME || "Vendrix"}
              <span className="text-emerald-600">PK</span>
            </h1>
            <h2 className="mt-3 text-xl font-bold text-zinc-900">Create account</h2>
            <p className="mt-1.5 text-sm text-zinc-500">Join for faster checkout and order tracking</p>
          </div>

          {/* Perks */}
          <div className="mt-5 space-y-2">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-2 text-sm text-zinc-600">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                </div>
                {perk}
              </div>
            ))}
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

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="reg-name" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Full name
              </label>
              <Input
                id="reg-name"
                className="mt-1.5 h-12 rounded-xl"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Email
              </label>
              <Input
                id="reg-email"
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
              <label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Password
              </label>
              <Input
                id="reg-password"
                type="password"
                className="mt-1.5 h-12 rounded-xl"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="h-12 w-full rounded-xl text-[15px] font-bold gap-2 shadow-lg shadow-zinc-900/10"
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-400">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="font-medium text-zinc-600 hover:text-zinc-900">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-zinc-600 hover:text-zinc-900">Privacy Policy</Link>.
          </p>

          <p className="mt-4 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
