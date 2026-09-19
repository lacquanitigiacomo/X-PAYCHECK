// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveAccessToken } from '../lib/authStorage';
import Checkout from './Checkout';
import PlanChoice from './PlanChoice';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route path="checkout" element={<Checkout />} />
        <Route path="onboarding" element={<div>Onboarding destination</div>} />
        <Route path="plans" element={<div>Plan choice destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current route">{location.pathname}</output>;
}

function renderPlanRecoveryFlow() {
  return render(
    <MemoryRouter initialEntries={['/checkout']}>
      <LocationProbe />
      <Routes>
        <Route path="checkout" element={<Checkout />} />
        <Route path="plans" element={<PlanChoice />} />
        <Route path="onboarding" element={<div>Onboarding destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Checkout', () => {
  beforeEach(() => {
    localStorage.clear();
    saveAccessToken('valid-token');
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('submits the selected simulated offer and follows refreshed account state', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: { nextStep: 'checkout' } })
      .mockResolvedValueOnce({ data: { nextStep: 'onboarding' } });
    vi.mocked(axios.post).mockResolvedValue({ data: { checkoutStatus: 'complete' } });
    renderCheckout();

    expect(await screen.findByRole('radio', { name: /2,99 €\/mese/ })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: /24,99 €\/anno/ }));
    const confirmOffer = screen.getByRole('button', { name: 'Conferma offerta' });
    await waitFor(() => expect(confirmOffer).toBeEnabled());
    fireEvent.click(confirmOffer);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/account/checkout',
        { tier: 'pro', billingCycle: 'yearly' },
        { headers: { Authorization: 'Bearer valid-token' } },
      );
    });
    expect(await screen.findByText('Onboarding destination')).toBeInTheDocument();
    expect(screen.queryByLabelText(/numero.*carta/i)).not.toBeInTheDocument();
  });

  it('cancels the pending Pro plan on the server before returning to plan choice', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { nextStep: 'checkout' } });
    vi.mocked(axios.post).mockResolvedValue({ data: { nextStep: 'onboarding' } });
    renderCheckout();

    await screen.findByRole('radio', { name: /2,99 €\/mese/ });
    const cancel = screen.getByRole('button', { name: 'Annulla e cambia piano' });
    await waitFor(() => expect(cancel).toBeEnabled());
    fireEvent.click(cancel);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/account/pending-plan/cancel',
        {},
        { headers: { Authorization: 'Bearer valid-token' } },
      );
    });
    expect(await screen.findByText('Plan choice destination')).toBeInTheDocument();
  });

  it('cancels checkout and continues with Free without another registration', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { nextStep: 'checkout' } });
    vi.mocked(axios.post).mockResolvedValue({ data: { nextStep: 'onboarding' } });
    renderPlanRecoveryFlow();

    const cancel = await screen.findByRole('button', { name: 'Annulla e cambia piano' });
    await waitFor(() => expect(cancel).toBeEnabled());
    fireEvent.click(cancel);
    fireEvent.click(await screen.findByRole('link', { name: 'Continua con Free' }));

    expect(await screen.findByText('Onboarding destination')).toBeInTheDocument();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/onboarding');
  });

  it('cancels checkout and can select Pro again without another registration', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: { nextStep: 'checkout' } })
      .mockResolvedValueOnce({ data: { nextStep: 'onboarding' } });
    vi.mocked(axios.post).mockResolvedValue({ data: { nextStep: 'onboarding' } });
    renderPlanRecoveryFlow();

    const cancel = await screen.findByRole('button', { name: 'Annulla e cambia piano' });
    await waitFor(() => expect(cancel).toBeEnabled());
    fireEvent.click(cancel);
    fireEvent.click(await screen.findByRole('link', { name: 'Continua con Pro' }));

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('heading', { name: 'Attiva X-PAY CHECK Pro' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/checkout');
  });
});
