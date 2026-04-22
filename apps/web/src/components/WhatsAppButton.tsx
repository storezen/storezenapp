"use client";

import { useEffect, useState } from "react";
import { WHATSAPP } from "@/lib/constants";

export function WhatsAppButton() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("storepk_wa_seen");
    if (!seen) {
      setShowPopup(true);
      const t = setTimeout(() => {
        setShowPopup(false);
        localStorage.setItem("storepk_wa_seen", "1");
      }, 6000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!WHATSAPP) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
      {showPopup ? (
        <div className="mb-3 max-w-[240px] rounded-lg bg-white p-3 text-xs text-[#1a1a1a] shadow-lg">
          Assalam-o-Alaikum! Hum aapki kya madad kar saktay hain?
        </div>
      ) : null}
      <a
        href={`https://wa.me/${WHATSAPP}`}
        aria-label="WhatsApp support"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-2xl text-white shadow-lg animate-pulseSoft"
      >
        ✆
      </a>
    </div>
  );
}
