// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import Register from './Register';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

describe('web authentication flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it('registers the selected Pro tier and routes from authoritative account state', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { token: 'registered-token' } });
    vi.mocked(axios.get).mockResolvedValue({ data: { nextStep: 'checkout' } });

    render(
      <MemoryRouter initialEntries={['/register?tier=pro']}>
        <Routes>
          <Route path="register" element={<Register />} />
          <Route path="checkout" element={<div>Checkout destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ada Rossi' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.it' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrati' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/auth/register',
        { name: 'Ada Rossi', email: 'ada@example.it', password: 'password123', tier: 'pro' },
      );
    });
    expect(await screen.findByText('Checkout destination')).toBeInTheDocument();
  });

  it('routes login from account state instead of the legacy work-profile response', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { token: 'login-token' } });
    vi.mocked(axios.get).mockResolvedValue({ data: { nextStep: 'dashboard' } });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="dashboard" element={<div>Dashboard destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.it' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Accedi' }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/account/state',
        { headers: { Authorization: 'Bearer login-token' } },
      );
    });
    expect(await screen.findByText('Dashboard destination')).toBeInTheDocument();
  });
});
