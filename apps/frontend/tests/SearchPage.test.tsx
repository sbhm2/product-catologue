import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchPage } from '@/pages/SearchPage';
import { createTestQueryClient, makeProduct } from './test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { Product } from '@catalogue/contracts';

jest.mock('@/api/catalogue', () => ({
  listProducts: jest.fn(),
  getProduct: jest.fn(),
  listCategories: jest.fn(),
}));

jest.mock('@/api/enquiries', () => ({
  submitEnquiry: jest.fn(),
}));

jest.mock('@/api/search', () => ({
  searchProductsByTitle: jest.fn(),
}));

import { searchProductsByTitle } from '@/api/search';
const mockedSearchProductsByTitle = searchProductsByTitle as jest.MockedFunction<
  typeof searchProductsByTitle
>;

function makeSearchProduct(overrides: Partial<Product> = {}): Product {
  return makeProduct({
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
  });
}

function renderSearchPage(initialQuery = '') {
  const client = createTestQueryClient();

  return render(
    <MemoryRouter
      initialEntries={['/search' + (initialQuery ? `?q=${encodeURIComponent(initialQuery)}` : '')]}
    >
      <QueryClientProvider client={client}>
        <SearchPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SearchPage', () => {
  it('renders empty catalogue state initially', () => {
    renderSearchPage();

    expect(screen.getByRole('heading', { name: 'Browse the catalogue' })).toBeInTheDocument();
  });

  it('submits the search query on Search button click', async () => {
    const user = userEvent.setup();
    renderSearchPage();

    const searchInput = screen.getByRole('searchbox', { name: 'Search products' });
    await user.type(searchInput, 'backpack');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(searchInput).toHaveValue('backpack');
    });
  });

  it('clears the query when the clear button is clicked', async () => {
    const user = userEvent.setup();
    renderSearchPage('backpack');

    const searchInput = screen.getByRole('searchbox', { name: 'Search products' });
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
      expect(window.location.search).toBe('');
    });
  });

  it('shows title matches and related items headings after search', async () => {
    const titleMatch = makeSearchProduct({ id: '1', title: 'Fjallraven Backpack' });
    const relatedItem = makeSearchProduct({ id: '2', title: 'Solid Gold Ring' });

    mockedSearchProductsByTitle.mockResolvedValue([titleMatch, relatedItem]);

    renderSearchPage('backpack');

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: 'Title matches' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Related items' })).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});