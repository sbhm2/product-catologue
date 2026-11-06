import { fireEvent, render, screen } from '@testing-library/react';
import { SearchBar } from '@/features/SearchBar';

describe('SearchBar', () => {
  it('submits the trimmed query with the form', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search products' }), {
      target: { value: '  backpack  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('backpack');
  });

  it('submits even when the input contains only whitespace', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('syncs the input with a new initial value', () => {
    const { rerender } = render(<SearchBar initialValue="ring" onSearch={jest.fn()} />);

    rerender(<SearchBar initialValue="necklace" onSearch={jest.fn()} />);

    expect(screen.getByRole('searchbox')).toHaveValue('necklace');
  });
});
