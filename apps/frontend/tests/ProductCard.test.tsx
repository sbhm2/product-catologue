import { screen } from '@testing-library/react';
import { ProductCard } from '@/features/ProductCard';
import { makeProduct, renderWithRouter, testProduct } from './test-utils';

describe('ProductCard', () => {
  it('renders the normalized product fields', () => {
    renderWithRouter(<ProductCard product={testProduct} />);

    expect(screen.getByRole('link', { name: testProduct.title })).toHaveAttribute(
      'href',
      '/products/1',
    );
    expect(screen.getByText("Men's Clothing")).toBeInTheDocument();
    expect(screen.getByText('$109.95')).toBeInTheDocument();
    expect(screen.getByText('3.9')).toBeInTheDocument();
    expect(screen.getByText('120 reviews')).toBeInTheDocument();
    expect(screen.getByText('Low stock')).toBeInTheDocument();
  });

  it('links to the product detail page', () => {
    const product = makeProduct({ id: '42', title: 'Solid Gold Ring' });
    renderWithRouter(<ProductCard product={product} />);

    expect(screen.getByRole('link', { name: 'Solid Gold Ring' })).toHaveAttribute(
      'href',
      '/products/42',
    );
  });

  it('shows a singular review count and out-of-stock state', () => {
    const product = makeProduct({ rating: { rate: 4, count: 1 }, stock: { status: 'out_of_stock' } });
    renderWithRouter(<ProductCard product={product} />);

    expect(screen.getByText('1 review')).toBeInTheDocument();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });
});
