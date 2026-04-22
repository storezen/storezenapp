import Link from "next/link";
import { STORE_NAME, WHATSAPP } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-800 bg-black text-white">
      <div className="shop-container grid gap-8 py-12 md:grid-cols-3">
        <div>
          <h3 className="section-title text-xl font-bold">{STORE_NAME || "StorePK"}</h3>
          <p className="mt-2 text-sm text-gray-300">Pakistan Ka Apna Online Store</p>
          <div className="mt-4 flex gap-3 text-sm text-gray-300">
            <a href="#">Instagram</a>
            <a href="#">Facebook</a>
            <a href="#">TikTok</a>
          </div>
        </div>
        <div>
          <h4 className="section-title font-semibold">Quick Links</h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-300">
            <Link className="hover:text-white" href="/products">Products</Link>
            <Link className="hover:text-white" href="/track">Track Order</Link>
            <Link className="hover:text-white" href="/login">Contact</Link>
          </div>
        </div>
        <div>
          <h4 className="section-title font-semibold">Contact</h4>
          <a className="mt-3 inline-block text-sm text-gray-300" href={`https://wa.me/${WHATSAPP}`}>
            WhatsApp: +{WHATSAPP}
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-400">
        © 2026 {STORE_NAME || "StorePK"}. Powered by StorePK
      </div>
    </footer>
  );
}
