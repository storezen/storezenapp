export type Review = {
  id: string;
  product_id: string;
  reviewer_name: string;
  city: string;
  rating: number;
  review_text: string;
  date: string;
  verified_purchase: boolean;
  helpful: number;
  review_image?: string;
};

export const reviews: Review[] = [
  /* ── Band T-Shirt (tshirt-1) ────────────────────────────────────────────── */
  {
    id: 'r-t1',
    product_id: 'tshirt-1',
    reviewer_name: 'Ahmed K.',
    city: 'Lahore',
    rating: 5,
    review_text: 'Bohot acha quality hai! Exactly jaisi description mein thi. Size M bilkul perfect fit tha. Fast delivery bhi mili 2 din mein. COD ka process bhi bahut smooth tha. Definitely recommend karta hoon!',
    date: '2 days ago',
    verified_purchase: true,
    helpful: 14,
    review_image: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=400&q=80',
  },
  {
    id: 'r-t2',
    product_id: 'tshirt-1',
    reviewer_name: 'Zara Q.',
    city: 'Karachi',
    rating: 5,
    review_text: 'Great fabric, soft aur comfortable hai. Maine 3 order kiye hain aur har baar quality same rahi. Definitely buying more colors next time!',
    date: '5 days ago',
    verified_purchase: true,
    helpful: 8,
  },
  {
    id: 'r-t3',
    product_id: 'tshirt-1',
    reviewer_name: 'Usman R.',
    city: 'Islamabad',
    rating: 4,
    review_text: 'Good product, packaging was neat. Color is exactly as shown in the photo. Fabric quality is great for the price. Only issue was delivery took 3 days instead of 2, but still satisfied.',
    date: '1 week ago',
    verified_purchase: true,
    helpful: 5,
  },
  {
    id: 'r-t4',
    product_id: 'tshirt-1',
    reviewer_name: 'Fatima N.',
    city: 'Peshawar',
    rating: 5,
    review_text: 'COD was easy, delivery in 3 days. T-shirt quality bohot acha hai, 100% cotton feel hai. Graphics print bhi clear hai, wash karne ke baad bhi nahi utri. Very happy with the purchase!',
    date: '2 weeks ago',
    verified_purchase: true,
    helpful: 11,
  },
  {
    id: 'r-t5',
    product_id: 'tshirt-1',
    reviewer_name: 'Hassan M.',
    city: 'Multan',
    rating: 5,
    review_text: 'Ordered XL size, fits perfectly. The band design is amazing, exactly like the product photo. My friends loved it. Zorvik is my go-to store now!',
    date: '3 weeks ago',
    verified_purchase: true,
    helpful: 9,
  },

  /* ── Rock Music eBook (ebook-1) ─────────────────────────────────────────── */
  {
    id: 'r-e1',
    product_id: 'ebook-1',
    reviewer_name: 'Bilal S.',
    city: 'Rawalpindi',
    rating: 5,
    review_text: 'Excellent content! Instantly got the PDF on WhatsApp within minutes of ordering. Very detailed guide for rock music lovers. Bohot kuch seekha iss book se. Value for money hai!',
    date: '3 days ago',
    verified_purchase: true,
    helpful: 7,
    review_image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
  },
  {
    id: 'r-e2',
    product_id: 'ebook-1',
    reviewer_name: 'Hira M.',
    city: 'Lahore',
    rating: 4,
    review_text: 'Good value for money. Learned a lot about music theory and rock history. PDF format is clean and readable on phone. Recommended for music enthusiasts!',
    date: '1 week ago',
    verified_purchase: true,
    helpful: 3,
  },
  {
    id: 'r-e3',
    product_id: 'ebook-1',
    reviewer_name: 'Tariq A.',
    city: 'Faisalabad',
    rating: 5,
    review_text: 'Maine music production seekhni thi aur ye book bohot helpful nikli. Chapters are well organized. EPUB format mera favourite hai. Will definitely buy more digital products from here.',
    date: '2 weeks ago',
    verified_purchase: true,
    helpful: 12,
  },
  {
    id: 'r-e4',
    product_id: 'ebook-1',
    reviewer_name: 'Sana B.',
    city: 'Karachi',
    rating: 4,
    review_text: 'Got both formats (PDF + EPUB), both work perfectly. Content is detailed and well researched. Great for beginners and intermediate music lovers alike.',
    date: '3 weeks ago',
    verified_purchase: true,
    helpful: 6,
  },
  {
    id: 'r-e5',
    product_id: 'ebook-1',
    reviewer_name: 'Omer F.',
    city: 'Islamabad',
    rating: 5,
    review_text: 'Delivery was instant on WhatsApp — no waiting! The ebook itself is worth every rupee. Rock music history explained amazingly. Gifted it to my cousin too.',
    date: '1 month ago',
    verified_purchase: true,
    helpful: 4,
  },

  /* ── Premium Perfume (perfume-1) ────────────────────────────────────────── */
  {
    id: 'r-p1',
    product_id: 'perfume-1',
    reviewer_name: 'Sara Q.',
    city: 'Lahore',
    rating: 5,
    review_text: 'Received in perfect condition, packaging was premium. Smell is luxurious and long-lasting — poora din rehti hai fragrance. Exactly jaise imported perfumes smell karte hain. Will order again!',
    date: '1 day ago',
    verified_purchase: true,
    helpful: 17,
    review_image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&q=80',
  },
  {
    id: 'r-p2',
    product_id: 'perfume-1',
    reviewer_name: 'Ahmed M.',
    city: 'Karachi',
    rating: 5,
    review_text: 'Fragrance lasts all day! Original smell, bohot acha imported product. Packing bhi premium thi, damage-proof packaging. Soch raha tha COD pe trust karun ya nahi — but 100% original mila. Highly recommend!',
    date: '4 days ago',
    verified_purchase: true,
    helpful: 22,
  },
  {
    id: 'r-p3',
    product_id: 'perfume-1',
    reviewer_name: 'Kamran B.',
    city: 'Multan',
    rating: 4,
    review_text: 'Good product but delivery took 4 days. Overall satisfied with the fragrance quality. 100ml bottle is good value for price. Packaging is proper, no leakage.',
    date: '1 week ago',
    verified_purchase: true,
    helpful: 6,
  },
  {
    id: 'r-p4',
    product_id: 'perfume-1',
    reviewer_name: 'Nadia H.',
    city: 'Islamabad',
    rating: 5,
    review_text: 'Ek dum best fragrance! Mere shohar ko gift kiya birthday pe aur unhein bohot pasand aayi. Smell sophisticated aur masculine hai. COD option hone se order karna easy tha.',
    date: '2 weeks ago',
    verified_purchase: true,
    helpful: 15,
  },
  {
    id: 'r-p5',
    product_id: 'perfume-1',
    reviewer_name: 'Rizwan A.',
    city: 'Lahore',
    rating: 5,
    review_text: 'Third time ordering this perfume — that says it all. Best value perfume available online in Pakistan. Zorvik always delivers on time and the quality is consistent.',
    date: '1 month ago',
    verified_purchase: true,
    helpful: 28,
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const _cache: Record<string, { avg: number; count: number }> = {};

export function getProductRating(productId: string): { avg: number; count: number } | null {
  if (!_cache[productId]) {
    const pr = reviews.filter(r => r.product_id === productId);
    if (!pr.length) return null;
    const avg = pr.reduce((s, r) => s + r.rating, 0) / pr.length;
    _cache[productId] = { avg: Math.round(avg * 10) / 10, count: pr.length };
  }
  return _cache[productId];
}

export function getProductReviews(productId: string): Review[] {
  return reviews.filter(r => r.product_id === productId);
}
