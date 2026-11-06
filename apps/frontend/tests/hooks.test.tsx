import { act, renderHook, waitFor } from '@testing-library/react';
import type { EnquiryInput, EnquiryReceipt, Product } from '@catalogue/contracts';
import { ApiError } from '@/api/client';
import { getProduct, listCategories, listProducts } from '@/api/catalogue';
import { submitEnquiry } from '@/api/enquiries';
import { useCategories } from '@/hooks/useCategories';
import { useProductDetail } from '@/hooks/useProductDetail';
import { useProducts } from '@/hooks/useProducts';
import { useSubmitEnquiry } from '@/hooks/useSubmitEnquiry';
import {
  createQueryWrapper,
  makeProduct,
  renderQueryHook,
  testMeta,
  testProduct,
} from './test-utils';

jest.mock('@/api/catalogue', () => ({
  listProducts: jest.fn(),
  getProduct: jest.fn(),
  listCategories: jest.fn(),
}));

jest.mock('@/api/enquiries', () => ({
  submitEnquiry: jest.fn(),
}));

const mockListProducts = listProducts as jest.MockedFunction<typeof listProducts>;
const mockGetProduct = getProduct as jest.MockedFunction<typeof getProduct>;
const mockListCategories = listCategories as jest.MockedFunction<typeof listCategories>;
const mockSubmitEnquiry = submitEnquiry as jest.MockedFunction<typeof submitEnquiry>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useProducts', () => {
  it('loads products and metadata for the query', async () => {
    mockListProducts.mockResolvedValue({ data: [testProduct], meta: testMeta });

    const { result } = renderQueryHook(() => useProducts({ category: 'mens-clothing', limit: 8 }));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([testProduct]);
    expect(result.current.meta).toEqual(testMeta);
    expect(result.current.isError).toBe(false);
    expect(mockListProducts).toHaveBeenCalledWith(
      { category: 'mens-clothing', search: undefined, limit: 8 },
      expect.anything(),
    );
  });

  it('exposes fetch errors and clears stale data', async () => {
    mockListProducts.mockRejectedValue(new Error('Network down'));

    const { result } = renderQueryHook(() => useProducts());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe('Network down');
    expect(result.current.data).toEqual([]);
    expect(result.current.meta).toBeNull();
  });

  it('refetches on demand', async () => {
    mockListProducts.mockResolvedValue({ data: [testProduct], meta: testMeta });

    const { result } = renderQueryHook(() => useProducts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.refetch());

    await waitFor(() => expect(mockListProducts).toHaveBeenCalledTimes(2));
  });
});

describe('useProductDetail', () => {
  it('loads a single product', async () => {
    mockGetProduct.mockResolvedValue(testProduct);

    const { result } = renderQueryHook(() => useProductDetail('1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(testProduct);
    expect(result.current.notFound).toBe(false);
    expect(mockGetProduct).toHaveBeenCalledWith('1', expect.anything());
  });

  it('flags a missing product', async () => {
    mockGetProduct.mockRejectedValue(new ApiError('No product found', 404, 'PRODUCT_NOT_FOUND'));

    const { result } = renderQueryHook(() => useProductDetail('999'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notFound).toBe(true);
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('does not call the API without an id', async () => {
    const { result } = renderQueryHook(() => useProductDetail(undefined));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetProduct).not.toHaveBeenCalled();
    expect(result.current.isError).toBe(true);
  });
});

describe('useCategories', () => {
  const categories = [
    { slug: 'jewelery', name: 'Jewelery', productCount: 4 },
    { slug: 'mens-clothing', name: "Men's Clothing", productCount: 6 },
  ];

  it('loads categories', async () => {
    mockListCategories.mockResolvedValue(categories);

    const { result } = renderQueryHook(() => useCategories());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(categories);
    expect(result.current.error).toBeNull();
  });

  it('exposes an error and supports retry', async () => {
    mockListCategories.mockRejectedValue(new Error('Upstream unavailable'));

    const { result } = renderQueryHook(() => useCategories());
    await waitFor(() => expect(result.current.isError).toBe(true));

    mockListCategories.mockResolvedValue([]);
    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(mockListCategories).toHaveBeenCalledTimes(2);
  });

  it('reuses cached data when the hook mounts again', async () => {
    mockListCategories.mockResolvedValue(categories);
    const wrapper = createQueryWrapper();

    const first = renderHook(() => useCategories(), { wrapper });
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    first.unmount();

    const second = renderHook(() => useCategories(), { wrapper });

    expect(second.result.current.isLoading).toBe(false);
    expect(second.result.current.data).toEqual(categories);
    expect(mockListCategories).toHaveBeenCalledTimes(1);
  });
});

describe('useSubmitEnquiry', () => {
  const input: EnquiryInput = {
    productId: '1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Is the backpack available in olive green?',
  };

  const receipt: EnquiryReceipt = {
    id: 'receipt-1234',
    productId: '1',
    receivedAt: '2026-02-03T10:15:00.000Z',
  };

  it('tracks a successful submission', async () => {
    mockSubmitEnquiry.mockResolvedValue(receipt);
    const { result } = renderQueryHook(() => useSubmitEnquiry());

    let returned: EnquiryReceipt | undefined;
    await act(async () => {
      returned = await result.current.submit(input);
    });

    expect(returned).toEqual(receipt);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.receipt).toEqual(receipt);
    expect(mockSubmitEnquiry).toHaveBeenCalledWith(input);
  });

  it('records the error and rethrows for the caller', async () => {
    mockSubmitEnquiry.mockRejectedValue(new ApiError('Provider down', 502, 'UPSTREAM_UNAVAILABLE'));
    const { result } = renderQueryHook(() => useSubmitEnquiry());

    await act(async () => {
      await expect(result.current.submit(input)).rejects.toThrow('Provider down');
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('resets its state', async () => {
    mockSubmitEnquiry.mockResolvedValue(receipt);
    const { result } = renderQueryHook(() => useSubmitEnquiry());

    await act(async () => {
      await result.current.submit(input);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => result.current.reset());

    await waitFor(() => expect(result.current.isSuccess).toBe(false));
    expect(result.current.receipt).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('product fixtures', () => {
  it('produces type-safe products', () => {
    const product: Product = makeProduct({ stock: { status: 'in_stock' } });
    expect(product.stock.status).toBe('in_stock');
  });
});
