import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { EnquiryReceipt } from '@catalogue/contracts';
import { EnquiryModal } from '@/features/EnquiryModal';
import { testProduct } from './test-utils';

const receipt: EnquiryReceipt = {
  id: 'abcd1234-0000-0000-0000-000000000000',
  productId: '1',
  receivedAt: '2026-02-03T10:15:00.000Z',
};

function renderModal(onSubmit: jest.Mock, onOpenChange = jest.fn()) {
  render(
    <EnquiryModal
      product={testProduct}
      open
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
    />,
  );

  return { onOpenChange };
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: '  Ada Lovelace  ' } });
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'ada@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Message'), {
    target: { value: '  Is the backpack available in olive green?  ' },
  });
}

describe('EnquiryModal', () => {
  it('shows the product context and fields', () => {
    renderModal(jest.fn());

    expect(screen.getByText('Enquire about this piece')).toBeInTheDocument();
    expect(
      screen.getByText(`${testProduct.title} · Send us a question and we will reply by email.`),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Your name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('validates with the shared schema before calling the API', () => {
    const onSubmit = jest.fn();
    renderModal(onSubmit);

    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Message is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reports an invalid email address', () => {
    const onSubmit = jest.fn();
    renderModal(onSubmit);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values and shows the success state', async () => {
    const onSubmit = jest.fn().mockResolvedValue(receipt);
    renderModal(onSubmit);

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('Enquiry received')).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      productId: '1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Is the backpack available in olive green?',
    });
    expect(screen.getByText(/will reply to/i)).toBeInTheDocument();
    expect(screen.getByText('Reference abcd1234')).toBeInTheDocument();
  });

  it('surfaces API failures inside the dialog', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Email service unavailable'));
    renderModal(onSubmit);

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('Email service unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send enquiry' })).toBeEnabled();
  });

  it('closes through the dialog close control', async () => {
    const { onOpenChange } = renderModal(jest.fn());

    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything()));
  });
});
