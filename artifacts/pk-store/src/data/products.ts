export type Product = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  category: "Clothing" | "Digital" | "Beauty" | string;
  image: string;
  variants?: {
    sizes?: string[];
    colors?: string[];
    options?: { name: string; price: number }[];
  };
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
    variants: {
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      colors: ["Black", "White"]
    }
  },
  {
    id: "ebook-1",
    name: "Rock Music eBook",
    price: 299,
    description: "Complete guide to rock music history and theory, instant digital delivery",
    category: "Digital",
    image: "/ebook.png",
    variants: {
      options: [
        { name: "PDF", price: 299 },
        { name: "EPUB", price: 299 },
        { name: "Both Formats", price: 449 }
      ]
    }
  },
  {
    id: "perfume-1",
    name: "Premium Perfume",
    price: 2499,
    compareAtPrice: 3500,
    description: "Luxury long-lasting fragrance, 100ml, imported",
    category: "Beauty",
    image: "/perfume.png"
  }
];
