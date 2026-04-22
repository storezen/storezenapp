import Link from "next/link";
import { STORE_NAME, WHATSAPP } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 bg-primary-dark text-white">
      <div className="shop-container grid gap-8 py-12 md:grid-cols-3">
        <div>
          <h3 className="heading-font text-xl font-bold">{STORE_NAME || "StorePK"}</h3>
          <p className="mt-2 text-sm text-gray-300">Pakistan Ka Apna Online Store</p>
        </div>
        <div>
          <h4 className="heading-font font-semibold">Quick Links</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-300">
            <Link className="hover:text-white" href="/products">Products</Link>
            <Link className="hover:text-white" href="/track">Track Order</Link>
            <Link className="hover:text-white" href="/login">Contact</Link>
          </div>
        </div>
        <div>
          <h4 className="heading-font font-semibold">Support</h4>
          <a className="mt-3 inline-block text-sm text-accent" href={`https://wa.me/${WHATSAPP}`}>
            WhatsApp Chat
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {STORE_NAME || "StorePK"}. All rights reserved.
      </div>
    </footer>
  );
}
