import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

describe('Button', () => {
  it('renders a clickable button', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Add to enquiry</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Add to enquiry' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and busy while loading', () => {
    render(<Button isLoading>Submitting</Button>);

    const button = screen.getByRole('button', { name: 'Submitting' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('defaults to type button so it never submits a form implicitly', () => {
    render(<Button>Close</Button>);

    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('type', 'button');
  });
});

describe('Input', () => {
  it('forwards value changes and accessibility props', () => {
    const onChange = jest.fn();
    render(
      <>
        <label htmlFor="email">Email</label>
        <Input id="email" value="" onChange={onChange} aria-invalid="true" />
      </>,
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(input, { target: { value: 'ada@example.com' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('Card', () => {
  it('composes the card sections with their content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Backpack</CardTitle>
          <CardDescription>Men&apos;s Clothing</CardDescription>
        </CardHeader>
        <CardContent>Water resistant.</CardContent>
        <CardFooter>$109.95</CardFooter>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Backpack', level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Men's Clothing")).toBeInTheDocument();
    expect(screen.getByText('Water resistant.')).toBeInTheDocument();
    expect(screen.getByText('$109.95')).toBeInTheDocument();
  });
});

describe('Dialog', () => {
  it('opens an accessible modal when the trigger is clicked', async () => {
    render(
      <Dialog>
        <DialogTrigger>Enquire</DialogTrigger>
        <DialogContent>
          <DialogTitle>Enquire about this piece</DialogTitle>
          <DialogDescription>We usually reply within one business day.</DialogDescription>
          <DialogClose>Cancel</DialogClose>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText('Enquire about this piece')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Enquire' }));

    expect(await screen.findByText('Enquire about this piece')).toBeInTheDocument();
    expect(screen.getByText('We usually reply within one business day.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('reports close requests to the controlled parent', async () => {
    const onOpenChange = jest.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Controlled dialog</DialogTitle>
          <DialogClose>Cancel</DialogClose>
        </DialogContent>
      </Dialog>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });
});
