"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, Package, Truck, MessageCircle, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WHATSAPP } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NEXT_STEPS = [
  { icon: MessageCircle, text: "We will confirm your order via WhatsApp", color: "bg-emerald-500/10 text-emerald-600" },
  { icon: Package, text: "Order packed and handed to courier in 1-2 days", color: "bg-emerald-50 text-emerald-600" },
  { icon: Truck, text: "Delivery in 2-4 working days across Pakistan", color: "bg-blue-50 text-blue-600" },
  { icon: Phone, text: "Pay cash on delivery when your order arrives", color: "bg-violet-50 text-violet-600" },
];

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard.writeText(params.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="safe-bottom min-h-screen px-4 pt-6 pb-12 md:pt-8">
      <div className="shop-container">
        <AnimatePresence mode="wait">
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-xl"
          >
            {/* Success Header */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 15 }}
              className="mb-6 flex flex-col items-center text-center"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 md:text-3xl">
                Order Placed Successfully!
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Shukriya! Aapka order receive ho gaya hai. Hum jald hi aap se rabta karenge.
              </p>
            </motion.div>

            {/* Order ID Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
            >
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Your Order ID
              </p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <p className="font-mono text-2xl font-bold text-zinc-900">{params.id}</p>
                <button
                  onClick={copyId}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* What Happens Next */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-5 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-4 text-base font-bold text-zinc-900">What Happens Next?</h2>
              <div className="space-y-3">
                {NEXT_STEPS.map(({ icon: Icon, text, color }, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                    className="flex items-start gap-3"
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", color)}>
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <p className="pt-1 text-sm text-zinc-600">{text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-3"
            >
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-lg shadow-zinc-900/10"
                  asChild
                >
                  <Link href="/track">
                    <Package className="h-4 w-4" strokeWidth={2} />
                    Track My Order
                  </Link>
                </Button>
                {WHATSAPP ? (
                  <Button
                    size="lg"
                    variant="whatsapp"
                    className="flex-1 h-12 rounded-xl font-bold gap-2"
                    asChild
                  >
                    <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" strokeWidth={2} />
                      WhatsApp Us
                    </a>
                  </Button>
                ) : null}
              </div>
              <Button
                variant="secondary"
                size="lg"
                className="h-12 w-full rounded-xl font-semibold"
                asChild
              >
                <Link href="/products">
                  Continue Shopping
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mt-5 flex items-center justify-center gap-6 text-xs text-zinc-400"
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                100% Authentic
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                Secure & Safe
              </span>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
