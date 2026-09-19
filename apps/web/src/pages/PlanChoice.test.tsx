// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { saveAccessToken } from '../lib/authStorage';
import PlanChoice from './PlanChoice';

function RegistrationDestination() {
  const location = useLocation();
  return <div>Registrazione {location.search}</div>;
}

describe('PlanChoice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(cleanup);

  it('carries the selected Pro tier into registration', () => {
    render(
      <MemoryRouter initialEntries={['/plans']}>
        <Routes>
          <Route path="plans" element={<PlanChoice />} />
          <Route path="register" element={<RegistrationDestination />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Continua con Pro' }));

    expect(screen.getByText('Registrazione ?tier=pro')).toBeInTheDocument();
  });

  it('sends an authenticated Free choice directly to onboarding', () => {
    saveAccessToken('authenticated-token');
    render(
      <MemoryRouter initialEntries={['/plans']}>
        <Routes>
          <Route path="plans" element={<PlanChoice />} />
          <Route path="onboarding" element={<div>Onboarding destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Continua con Free' }));

    expect(screen.getByText('Onboarding destination')).toBeInTheDocument();
  });

  it('sends an authenticated Pro choice directly to checkout', () => {
    saveAccessToken('authenticated-token');
    render(
      <MemoryRouter initialEntries={['/plans']}>
        <Routes>
          <Route path="plans" element={<PlanChoice />} />
          <Route path="checkout" element={<div>Checkout destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Continua con Pro' }));

    expect(screen.getByText('Checkout destination')).toBeInTheDocument();
  });
});
