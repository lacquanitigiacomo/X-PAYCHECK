// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveAccessToken } from '../lib/authStorage';
import Onboarding from './Onboarding';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

describe('Onboarding', () => {
  beforeEach(() => {
    localStorage.clear();
    saveAccessToken('valid-token');
    vi.clearAllMocks();
    vi.mocked(axios.get).mockResolvedValue({ data: { nextStep: 'onboarding', tier: 'free' } });
    vi.mocked(axios.put).mockResolvedValue({ data: { nextStep: 'dashboard' } });
  });

  afterEach(cleanup);

  it('collects CCNL, weekly hours, and an explicit seven-day schedule', async () => {
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="dashboard" element={<div>Dashboard destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByLabelText('Codice o denominazione CCNL'), {
      target: { value: 'CCNL Turismo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continua' }));

    const weeklyHours = screen.getByLabelText('Ore contrattuali settimanali');
    fireEvent.change(weeklyHours, { target: { value: '36' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continua' }));

    for (const day of ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']) {
      expect(screen.getByRole('checkbox', { name: day })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lunedì' }));
    expect(screen.getByLabelText('Inizio Lunedì')).toHaveValue('09:00');
    expect(screen.getByLabelText('Fine Lunedì')).toHaveValue('18:00');
    fireEvent.click(screen.getByRole('button', { name: 'Completa configurazione' }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/account/work-profile',
        {
          ccnl: 'CCNL Turismo',
          weeklyHours: 36,
          schedule: [
            { day: 1, enabled: true, start: '09:00', end: '18:00' },
            { day: 2, enabled: false, start: null, end: null },
            { day: 3, enabled: false, start: null, end: null },
            { day: 4, enabled: false, start: null, end: null },
            { day: 5, enabled: false, start: null, end: null },
            { day: 6, enabled: false, start: null, end: null },
            { day: 7, enabled: false, start: null, end: null },
          ],
          badgeEnabled: false,
        },
        { headers: { Authorization: 'Bearer valid-token' } },
      );
    });
    expect(await screen.findByText('Dashboard destination')).toBeInTheDocument();
  });
});
