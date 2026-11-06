import type { Product } from '@catalogue/contracts';

export interface RawFakeStoreProductFixture {
  id: number | string;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: { rate: number; count: number };
}

export function makeRawFakeStoreProduct(
  overrides: Partial<RawFakeStoreProductFixture> = {},
): RawFakeStoreProductFixture {
  return {
    id: 1,
    title: 'Fjallraven - Foldsack No. 1 Backpack',
    price: 109.95,
    description: 'Your perfect pack for everyday use and walks in the forest.',
    category: "men's clothing",
    image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
    rating: { rate: 3.9, count: 120 },
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '1',
    title: 'Fjallraven - Foldsack No. 1 Backpack',
    description: 'Your perfect pack for everyday use and walks in the forest.',
    price: 109.95,
    currency: 'USD',
    category: 'mens-clothing',
    categoryLabel: "Men's Clothing",
    imageUrl: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
    rating: { rate: 3.9, count: 120 },
    stock: { status: 'low_stock' },
    ...overrides,
  };
}

export const backpack = makeProduct();

export const goldRing = makeProduct({
  id: '2',
  title: 'Solid Gold Petite Micropave',
  description: 'Satisfaction Guaranteed. Return or exchange any order within 30 days.',
  price: 168,
  category: 'jewelery',
  categoryLabel: 'Jewelery',
  imageUrl: 'https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_.jpg',
  rating: { rate: 4.6, count: 400 },
  stock: { status: 'in_stock' },
});

export const headphones = makeProduct({
  id: '3',
  title: 'Sony Wireless Headphones',
  description: 'High fidelity sound with noise cancelling for long listening sessions.',
  price: 89.99,
  category: 'electronics',
  categoryLabel: 'Electronics',
  imageUrl: 'https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg',
  rating: { rate: 4.1, count: 60 },
  stock: { status: 'low_stock' },
});

export const products = [backpack, goldRing, headphones];
