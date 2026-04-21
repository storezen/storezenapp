export type Product = {
  id: string;
  slug?: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  category: "Clothing" | "Digital" | "Beauty" | string;
  image: string;
  images?: string[];
  variants?: {
    sizes?: string[];
    colors?: string[];
    options?: { name: string; price: number }[];
  };
  stock?: number;
  status?: 'active' | 'draft';
};

export const products: Product[] = [
  {
    id: "tshirt-1",
    name: "Band T-Shirt",
    price: 999,
    compareAtPrice: 1499,
    description: "Premium quality band t-shirt, 100% cotton, unisex fit",
    category: "Clothing",
    image: "/tshirt.png",
    images: [
      "/tshirt.png",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
    ],
    variants: {
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      colors: ["Black", "White"]
    },
    stock: 50,
    status: 'active',
  },
  {
    id: "ebook-1",
    name: "Rock Music eBook",
    price: 299,
    description: "Complete guide to rock music history and theory, instant digital delivery",
    category: "Digital",
    image: "/ebook.png",
    images: [
      "/ebook.png",
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80",
    ],
    variants: {
      options: [
        { name: "PDF", price: 299 },
        { name: "EPUB", price: 299 },
        { name: "Both Formats", price: 449 }
      ]
    },
    stock: 999,
    status: 'active',
  },
  {
    id: "perfume-1",
    name: "Premium Perfume",
    price: 2499,
    compareAtPrice: 3500,
    description: "Luxury long-lasting fragrance, 100ml, imported",
    category: "Beauty",
    image: "/perfume.png",
    images: [
      "/perfume.png",
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80",
      "https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=800&q=80",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80",
    ],
    stock: 20,
    status: 'active',
  }
];
