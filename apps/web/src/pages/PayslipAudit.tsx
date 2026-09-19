import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, Clock, Shield, AlertTriangle, Check, ArrowLeft } from 'lucide-react';
import { getAccessToken } from '../lib/authStorage';
import { readFileAsBase64 } from '../lib/fileEncoding';
import { uploadPayslipWithFreeReplacementConfirmation } from '../lib/payslipUpload';
import { API_BASE_URL } from '../lib/api';

export default function PayslipAudit() {
  const navigate = useNavigate();
  const [payslipFile, setPayslipFile] = useState<File | null>(null);
  const [hoursFile, setHoursFile] = useState<File | null>(null);
  const [payslipData, setPayslipData] = useState<any>(null);
  const [payslipError, setPayslipError] = useState<string | null>(null);
  const [hoursData, setHoursData] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }
    let active = true;
    void axios.get(`${API_BASE_URL}/account/state`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data }) => {
      if (active) setIsPro(data.tier === 'pro');
    }).catch(() => undefined);
    return () => { active = false; };
  }, [navigate]);

  const handlePayslipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPayslipError(null);
    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Sessione non valida');
      const fileData = await readFileAsBase64(file);
      // Simula upload: in produzione usa FormData con multer.
      const request = {
        fileData,
        mimeType: file.type,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      };
      const result = await uploadPayslipWithFreeReplacementConfirmation({
        request,
        upload: payload => axios.post(`${API_BASE_URL}/payslips`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        confirmReplacement: () => window.confirm(
          'Il piano Free conserva un solo cedolino. Vuoi sostituire quello già salvato?',
        ),
      });

      if (result.status === 'replacement_cancelled') {
        setPayslipError('Sostituzione annullata: il cedolino già salvato è stato mantenuto.');
        return;
      }

      setPayslipFile(file);
      setPayslipData(result.response.data.payslip);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Impossibile caricare la busta paga.'
        : 'Impossibile caricare la busta paga.';
      setPayslipError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleHoursUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHoursFile(file);
    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Sessione non valida');
      const fileData = await readFileAsBase64(file);
      const res = await axios.post(`${API_BASE_URL}/upload/hours`, {
        fileData,
        month: '05',
        year: '2026',
        entries: [
          { date: '2026-05-01', hours: 8 },
          { date: '2026-05-02', hours: 8 },
          { date: '2026-05-03', hours: 6 },
        ],
      }, { headers: { Authorization: `Bearer ${token}` } });
      setHoursData(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runVerification = async () => {
    if (!payslipData || !hoursData) return;
    setLoading(true);
    try {
      setVerification({
        verified: false,
        discrepancies: ['Funzione non ancora disponibile: completa i dati normalizzati del cedolino per avviare le regole di audit.'],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
        <ArrowLeft size={18} /> Torna alla Dashboard
      </button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Audit busta paga</h1>
          <p className="text-gray-400">Carica busta paga e orari per verificare correttezza e completezza.</p>
        </div>
        {isPro ? <Link to="/archive" className="xpay-secondary">Apri archivio</Link> : null}
      </div>

      {/* Upload Zone */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-xpay-panel border border-xpay-line">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-xpay-mint" />
            <h3 className="font-semibold">Busta Paga</h3>
          </div>
          <label className="block w-full p-8 border-2 border-dashed border-xpay-line rounded-xl hover:border-xpay-mint/50 cursor-pointer text-center transition">
            <Upload className="mx-auto mb-2 text-gray-500" />
            <span className="text-gray-400 text-sm">{payslipFile ? payslipFile.name : 'Trascina o clicca per caricare PDF/immagine'}</span>
            <input aria-label="Carica busta paga" type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handlePayslipUpload} />
          </label>
          {payslipError && (
            <div role="alert" className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-300 text-sm">
              {payslipError}
            </div>
          )}
          {payslipData && (
            <div className="mt-4 p-3 rounded-lg bg-xpay-soft text-sm space-y-1">
              <div className="font-semibold text-xpay-mint">Cedolino salvato</div>
              <div className="flex justify-between"><span>Periodo:</span><span className="font-mono">{payslipData.month}/{payslipData.year}</span></div>
            </div>
          )}
        </div>

        <div className="p-6 rounded-xl bg-xpay-panel border border-xpay-line">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-blue-500" />
            <h3 className="font-semibold">Orari / Presenze</h3>
          </div>
          <label className="block w-full p-8 border-2 border-dashed border-xpay-line rounded-xl hover:border-blue-500/50 cursor-pointer text-center transition">
            <Upload className="mx-auto mb-2 text-gray-500" />
            <span className="text-gray-400 text-sm">{hoursFile ? hoursFile.name : 'Trascina o clicca per caricare orari'}</span>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv" className="hidden" onChange={handleHoursUpload} />
          </label>
          {hoursData && (
            <div className="mt-4 p-3 rounded-lg bg-xpay-soft text-sm space-y-1">
              <div className="flex justify-between"><span>Ore totali:</span><span className="font-mono">{hoursData.totalHours}h</span></div>
              <div className="flex justify-between"><span>Giorni:</span><span className="font-mono">{hoursData.entries?.length || 0}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Verify Button */}
      {payslipData && hoursData && (
        <button
          onClick={runVerification}
          disabled={loading}
          className="w-full py-4 bg-xpay-mint hover:bg-xpay-cyan rounded-xl text-xpay-ink font-bold text-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          <Shield size={20} />
          {loading ? 'Analisi in corso...' : 'Avvia Verifica AI'}
        </button>
      )}

      {/* Results */}
      {verification && (
        <div className="p-6 rounded-xl bg-xpay-panel border border-xpay-line space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            {verification.verified ? <Check className="text-xpay-mint" /> : <AlertTriangle className="text-amber-500" />}
            Risultato Verifica
          </h3>

          {verification.discrepancies?.length > 0 && (
            <div className="space-y-2">
              <div className="text-red-400 font-semibold">Discrepanze rilevate:</div>
              {verification.discrepancies.map((d: string, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-300 text-sm">
                  {d}
                </div>
              ))}
            </div>
          )}

          {verification.verified && (
            <div className="p-4 rounded-lg bg-xpay-mint/10 border border-xpay-mint/40 text-xpay-mint">
              Nessuna discrepanza rilevata. Busta paga e orari sono coerenti.
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="p-3 rounded-lg bg-xpay-soft">
              <div className="text-gray-400">Lordo</div>
              <div className="font-mono font-bold">€{verification.payslipSummary?.gross}</div>
            </div>
            <div className="p-3 rounded-lg bg-xpay-soft">
              <div className="text-gray-400">Netto</div>
              <div className="font-mono font-bold">€{verification.payslipSummary?.net}</div>
            </div>
            <div className="p-3 rounded-lg bg-xpay-soft">
              <div className="text-gray-400">Ore</div>
              <div className="font-mono font-bold">{verification.payslipSummary?.totalHours}h</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
