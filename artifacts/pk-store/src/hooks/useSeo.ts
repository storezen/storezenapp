import { useEffect } from 'react';
import { STORE_CONFIG } from '../config';

export interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product';
  price?: number;
  currency?: string;
  structuredData?: object;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setStructuredData(data: object) {
  let el = document.getElementById('ld-json') as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = 'ld-json';
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeStructuredData() {
  document.getElementById('ld-json')?.remove();
}

export function useSeo({
  title,
  description,
  image,
  url,
  type = 'website',
  price,
  currency = STORE_CONFIG.currency,
  structuredData,
}: SeoOptions) {
  useEffect(() => {
    const pageUrl = url || window.location.href;
    const ogImage = image || `${window.location.origin}/opengraph.jpg`;
    const desc = description || STORE_CONFIG.description.slice(0, 160);

    document.title = title;

    setMeta('description', desc);

    setMeta('og:title', title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:url', pageUrl, 'property');
    setMeta('og:type', type, 'property');
    setMeta('og:site_name', STORE_CONFIG.storeName, 'property');

    if (type === 'product' && price != null) {
      setMeta('product:price:amount', String(price), 'property');
      setMeta('product:price:currency', currency, 'property');
    }

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', ogImage);

    if (structuredData) {
      setStructuredData(structuredData);
    } else {
      removeStructuredData();
    }
  }, [title, description, image, url, type, price, currency, structuredData]);
}
