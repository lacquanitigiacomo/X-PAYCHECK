// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from './Login';

vi.mock('../components/GoogleAuthButton', () => ({
  default: ({
    intent,
    onError,
  }: {
    intent: 'register' | 'login';
    onError: (error: { message: string; code?: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onError(intent === 'login'
        ? { message: 'Account Google non registrato', code: 'GOOGLE_ACCOUNT_NOT_REGISTERED' }
        : { message: 'Intent Google errato' })}
    >
      Simula account Google sconosciuto
    </button>
  ),
}));

describe('Google login flow', () => {
  it('routes an unknown Google login to plan choice for a fresh registration', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="plans" element={<div>Plan choice destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Simula account Google sconosciuto' }));

    expect(screen.getByText('Plan choice destination')).toBeInTheDocument();
  });
});
