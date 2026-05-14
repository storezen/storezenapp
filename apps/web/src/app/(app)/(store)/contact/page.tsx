"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Mail, MapPin, Clock, CheckCircle2, Send, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WHATSAPP, STORE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Enter your name";
    if (!form.email.trim()) next.email = "Enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (!form.message.trim()) next.message = "Enter a message";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => { setSent(true); setLoading(false); }, 1200);
  }

  const info = [
    {
      Icon: MessageCircle,
      title: "WhatsApp",
      sub: WHATSAPP ? `+${WHATSAPP}` : "Configure WHATSAPP",
      detail: "Fastest response · 9 AM – 10 PM",
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      Icon: Mail,
      title: "Email",
      sub: "support@storezen.pk",
      detail: "We reply within 24 hours",
      color: "bg-blue-50 text-blue-600",
    },
    {
      Icon: MapPin,
      title: "Location",
      sub: "Lahore, Pakistan",
      detail: "Serving all of Pakistan",
      color: "bg-amber-50 text-amber-600",
    },
    {
      Icon: Clock,
      title: "Hours",
      sub: "9 AM – 10 PM",
      detail: "Monday to Saturday",
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="safe-bottom pb-12 pt-6 md:pt-8">
      <div className="shop-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4 inline-flex"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              <Zap className="h-6 w-6" strokeWidth={2.5} />
            </div>
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
            Get in Touch
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            We&apos;re here to help with orders, products, or partnerships
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr,400px] lg:gap-8">
          {/* Left: Form + WhatsApp */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                  <Send className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                </div>
                <h2 className="text-lg font-bold text-zinc-900">Send a message</h2>
              </div>

              {sent ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", damping: 15 }}
                    className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
                  >
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-zinc-900">Message sent!</h3>
                  <p className="mt-1.5 text-sm text-zinc-500">We&apos;ll get back to you within one business day.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-6 h-11 rounded-xl px-6"
                    onClick={() => setSent(false)}
                  >
                    Send another
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-name" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Name
                      </label>
                      <Input
                        id="c-name"
                        className={cn("mt-1.5 h-12 rounded-xl", fieldErrors.name && "border-red-300")}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        autoComplete="name"
                        required
                      />
                      {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
                    </div>
                    <div>
                      <label htmlFor="c-email" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Email
                      </label>
                      <Input
                        id="c-email"
                        type="email"
                        className={cn("mt-1.5 h-12 rounded-xl", fieldErrors.email && "border-red-300")}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        autoComplete="email"
                        required
                      />
                      {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="c-phone" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Phone <span className="font-normal text-zinc-400">(optional)</span>
                    </label>
                    <Input
                      id="c-phone"
                      className="mt-1.5 h-12 rounded-xl"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label htmlFor="c-msg" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Message
                    </label>
                    <Textarea
                      id="c-msg"
                      className={cn("mt-1.5 min-h-[120px] rounded-xl resize-none", fieldErrors.message && "border-red-300")}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                    />
                    {fieldErrors.message ? <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p> : null}
                  </div>
                  <Button
                    type="submit"
                    loading={loading}
                    size="lg"
                    className="h-12 w-full rounded-xl text-[15px] font-bold shadow-lg shadow-zinc-900/10"
                  >
                    Send message
                  </Button>
                </form>
              )}
            </motion.div>

            {WHATSAPP ? (
              <motion.a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 flex items-center gap-4 rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-5 transition-colors hover:border-emerald-500/40 hover:from-emerald-500/15 hover:to-emerald-600/15"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                  <MessageCircle className="h-6 w-6" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-base font-bold text-zinc-900">Chat on WhatsApp</p>
                  <p className="mt-0.5 text-sm text-zinc-500">Fastest way to reach the team</p>
                </div>
                <div className="ml-auto">
                  <div className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                </div>
              </motion.a>
            ) : null}
          </div>

          {/* Right: Info cards */}
          <div className="order-1 lg:order-2">
            <div className="space-y-3">
              {info.map(({ Icon, title, sub, detail, color }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-start gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", color)}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900">{title}</p>
                    <p className="text-sm font-semibold text-zinc-700">{sub}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-5 flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4"
            >
              {[
                { icon: Clock, text: "24hr Reply" },
                { icon: MessageCircle, text: "WhatsApp Support" },
                { icon: CheckCircle2, text: "Real Humans" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Icon className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2} />
                  {text}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
