// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveAccessToken } from '../lib/authStorage';
import PayslipAudit from './PayslipAudit';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn((error: unknown) => Boolean((error as { response?: unknown }).response)),
  },
}));

vi.mock('../lib/fileEncoding', () => ({
  readFileAsBase64: vi.fn().mockResolvedValue('encoded-payslip'),
}));

describe('PayslipAudit', () => {
  beforeEach(() => {
    localStorage.clear();
    saveAccessToken('valid-token');
    vi.clearAllMocks();
    vi.mocked(axios.get).mockResolvedValue({ data: { tier: 'free' } });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uses the canonical payslips route and confirms a Free replacement before retrying', async () => {
    const now = new Date();
    vi.mocked(axios.post)
      .mockRejectedValueOnce({ response: { status: 409, data: { error: 'FREE_REPLACE_CONFIRMATION_REQUIRED' } } })
      .mockResolvedValueOnce({
        data: {
          success: true,
          replaced: true,
          payslip: { month: now.getMonth() + 1, year: now.getFullYear() },
        },
      });

    render(<MemoryRouter><PayslipAudit /></MemoryRouter>);
    const upload = screen.getByLabelText('Carica busta paga');
    fireEvent.change(upload, { target: { files: [new File(['pdf'], 'cedolino.pdf', { type: 'application/pdf' })] } });

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(2));
    const request = {
      fileData: 'encoded-payslip',
      mimeType: 'application/pdf',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3001/api/v1/payslips',
      request,
      { headers: { Authorization: 'Bearer valid-token' } },
    );
    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3001/api/v1/payslips',
      { ...request, confirmReplace: true },
      { headers: { Authorization: 'Bearer valid-token' } },
    );
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Cedolino salvato/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Apri archivio' })).not.toBeInTheDocument();
  });

  it('links Pro users to their multi-item archive', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { tier: 'pro' } });

    render(<MemoryRouter><PayslipAudit /></MemoryRouter>);

    expect(await screen.findByRole('link', { name: 'Apri archivio' })).toHaveAttribute('href', '/archive');
  });
});
