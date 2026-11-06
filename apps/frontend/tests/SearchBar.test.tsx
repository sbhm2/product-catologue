import { act, fireEvent, render, screen } from '@testing-library/react';
import { SearchBar } from '@/features/SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('submits the trimmed query with the form', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search products' }), {
      target: { value: '  backpack  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('backpack');
  });

  it('calls onDebouncedChange only after the user stops typing', () => {
    const onDebouncedChange = jest.fn();
    render(<SearchBar onSearch={jest.fn()} onDebouncedChange={onDebouncedChange} debounceMs={300} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'gold' } });

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(onDebouncedChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onDebouncedChange).toHaveBeenCalledWith('gold');
  });

  it('does not fire a debounced search for the initial value', () => {
    const onDebouncedChange = jest.fn();
    render(
      <SearchBar
        initialValue="ring"
        onSearch={jest.fn()}
        onDebouncedChange={onDebouncedChange}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onDebouncedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('searchbox')).toHaveValue('ring');
  });

  it('syncs the input with a new initial value', () => {
    const { rerender } = render(<SearchBar initialValue="ring" onSearch={jest.fn()} />);

    rerender(<SearchBar initialValue="necklace" onSearch={jest.fn()} />);

    expect(screen.getByRole('searchbox')).toHaveValue('necklace');
  });
});
