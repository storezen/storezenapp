import React from 'react';
import { MessageCircle } from 'lucide-react';
import { STORE_CONFIG } from '../config';

export function WhatsAppButton() {
  const handleClick = () => {
    const message = encodeURIComponent(`Hi ${STORE_CONFIG.storeName}! I need some help.`);
    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:bg-[#128C7E] transition-colors hover-elevate flex items-center justify-center"
      aria-label="Chat on WhatsApp"
      data-testid="button-whatsapp-floating"
    >
      <MessageCircle size={28} />
    </button>
  );
}
