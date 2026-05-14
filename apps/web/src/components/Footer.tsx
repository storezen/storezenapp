"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, MapPin, Phone, Mail } from "lucide-react";
import { STORE_NAME, WHATSAPP, PHONE } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Smartwatches", href: "/products" },
      { label: "Earbuds", href: "/products" },
      { label: "Accessories", href: "/products" },
      { label: "New Arrivals", href: "/products" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Track Order", href: "/track" },
      { label: "Contact Us", href: "/contact" },
      { label: "Return Policy", href: "/refund" },
      { label: "FAQs", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      {/* Main footer */}
      <div className="shop-container py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-extrabold tracking-tight text-zinc-900">
              {STORE_NAME || "Storezen"}
              <span className="text-emerald-600">PK</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              Pakistan&apos;s most trusted destination for premium smartwatches, earbuds, and accessories. Quality guaranteed, COD available nationwide.
            </p>

            {/* Social + WhatsApp */}
            <div className="mt-6 flex items-center gap-3">
              {WHATSAPP ? (
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  WhatsApp Us
                </a>
              ) : null}
              <div className="flex items-center gap-2">
                {[
                  {
                    label: "Instagram",
                    href: "https://instagram.com",
                    icon: (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Facebook",
                    href: "https://facebook.com",
                    icon: (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    ),
                  },
                ].map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-700"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: "COD Available", sub: "Pay on delivery" },
                { label: "Easy Returns", sub: "7-day policy" },
                { label: "100+ Cities", sub: "Nationwide delivery" },
              ].map((badge) => (
                <div key={badge.label} className="text-center">
                  <p className="text-xs font-semibold text-zinc-900">{badge.label}</p>
                  <p className="text-[10px] text-zinc-400">{badge.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                      href={href}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Contact bar */}
      <div className="border-b border-zinc-100 bg-zinc-50/50">
        <div className="shop-container flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
          <div className="flex flex-wrap items-center gap-6">
            {PHONE ? (
              <a href={`tel:${PHONE}`} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900">
                <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                {PHONE}
              </a>
            ) : null}
            <a href={`https://wa.me/${WHATSAPP}`} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900">
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
              WhatsApp Chat
            </a>
            <span className="flex items-center gap-2 text-xs text-zinc-500">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
              Lahore, Pakistan
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-zinc-400">We Accept:</span>
            {["COD", "JazzCash", "Easypaisa"].map((m) => (
              <span key={m} className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-white">
        <div className="shop-container flex flex-col items-center justify-between gap-3 py-4 text-xs text-zinc-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {STORE_NAME || "Storezen PK"}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-zinc-700">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-zinc-700">Terms</Link>
            <Link href="/refund" className="transition-colors hover:text-zinc-700">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
