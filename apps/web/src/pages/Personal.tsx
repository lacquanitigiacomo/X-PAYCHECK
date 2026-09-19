import { useMemo, useState } from 'react';
import { BriefcaseBusiness, Check, FileText, IdCard, Save, Search, ShieldCheck, UserRound } from 'lucide-react';
import MonthDayPicker from '../components/MonthDayPicker';

const months = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

const ccnlCatalog = [
  { code: 'CCNL-COMMERCIO', name: 'Commercio, Terziario e Servizi', version: '2024-2027', updated: 'Aggiornato', levels: ['1', '2', '3', '4', '5', '6', '7'] },
  { code: 'CCNL-METALMECCANICO', name: 'Metalmeccanico Industria', version: '2024-2027', updated: 'Aggiornato', levels: ['A1', 'B1', 'B2', 'C1', 'C2', 'C3'] },
  { code: 'CCNL-TURISMO', name: 'Turismo e Pubblici Esercizi', version: '2024-2027', updated: 'Aggiornato', levels: ['Quadri', '1', '2', '3', '4', '5', '6'] },
  { code: 'CCNL-LOGISTICA', name: 'Logistica, Trasporto Merci e Spedizione', version: '2024-2027', updated: 'Aggiornato', levels: ['1', '2', '3S', '3', '4', '5', '6J'] },
  { code: 'CCNL-MULTISERVIZI', name: 'Pulizie e Multiservizi', version: '2023-2026', updated: 'Aggiornato', levels: ['1', '2', '3', '4', '5', '6', '7'] },
  { code: 'CCNL-COOPERATIVE', name: 'Cooperative Sociali', version: '2023-2025', updated: 'Da verificare', levels: ['A1', 'A2', 'B1', 'C1', 'C2', 'D1', 'D2'] },
  { code: 'CCNL-SANITA', name: 'Sanita Privata', version: '2024-2026', updated: 'Aggiornato', levels: ['A', 'B', 'C', 'D', 'E', 'F'] },
  { code: 'CCNL-STUDI', name: 'Studi Professionali', version: '2024-2027', updated: 'Aggiornato', levels: ['1', '2', '3S', '3', '4S', '4', '5'] },
];

type ProfileDraft = {
  name: string;
  surname: string;
  email: string;
  phone: string;
  taxCode: string;
  contractType: string;
  weeklyHours: string;
  baseSalary: string;
  company: string;
  workplace: string;
  role: string;
};

const defaultProfile: ProfileDraft = {
  name: 'Giacomo',
  surname: '',
  email: 'user@xpay.local',
  phone: '',
  taxCode: '',
  contractType: 'indeterminato',
  weeklyHours: '40',
  baseSalary: '',
  company: '',
  workplace: '',
  role: '',
};

const storageKey = 'xpay_personal_profile';

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

type MiniDateProps = {
  label: string;
  day: number;
  month: number;
  year: number;
  onChange: (value: { day: number; month: number; year: number }) => void;
};

function MiniDateField({ label, day, month, year, onChange }: MiniDateProps) {
  const maxDays = daysInMonth(month, year);
  const safeDay = Math.min(day, maxDays);

  return (
    <div>
      <span className="mb-2 block text-sm text-gray-400">{label}</span>
      <div className="rounded-lg border border-xpay-line bg-black/15 p-3">
        <div className="mb-3 grid grid-cols-[1fr_90px] gap-2">
          <select
            className="xpay-field !py-2"
            value={month}
            onChange={(event) => onChange({ day: Math.min(safeDay, daysInMonth(Number(event.target.value), year)), month: Number(event.target.value), year })}
          >
            {months.map((item, index) => <option key={item} value={index}>{item}</option>)}
          </select>
          <input
            className="xpay-field !py-2"
            type="number"
            value={year}
            onChange={(event) => onChange({ day: safeDay, month, year: Number(event.target.value) })}
          />
        </div>
        <MonthDayPicker
          daysInMonth={maxDays}
          monthLabel={months[month]}
          selectedDay={safeDay}
          onSelectDay={(nextDay) => onChange({ day: nextDay, month, year })}
          numberGrid
          fadeUnselected
        />
      </div>
    </div>
  );
}

export default function Personal() {
  const stored = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) as Partial<ProfileDraft> & {
        ccnlCode?: string;
        level?: string;
        birthDate?: { day: number; month: number; year: number };
        hireDate?: { day: number; month: number; year: number };
      } : null;
    } catch {
      return null;
    }
  }, []);
  const initialCcnl = ccnlCatalog.find((item) => item.code === stored?.ccnlCode) || ccnlCatalog[0];
  const [query, setQuery] = useState('');
  const [selectedCcnl, setSelectedCcnl] = useState(initialCcnl);
  const [level, setLevel] = useState(stored?.level || '5');
  const [birthDate, setBirthDate] = useState(stored?.birthDate || { day: 12, month: 2, year: 1992 });
  const [hireDate, setHireDate] = useState(stored?.hireDate || { day: 1, month: 3, year: 2024 });
  const [profile, setProfile] = useState<ProfileDraft>({ ...defaultProfile, ...stored });
  const [saved, setSaved] = useState(false);

  const filteredCcnl = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return ccnlCatalog;
    return ccnlCatalog.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(text));
  }, [query]);

  const saveProfile = () => {
    localStorage.setItem(storageKey, JSON.stringify({
      ...profile,
      ccnlCode: selectedCcnl.code,
      level,
      birthDate,
      hireDate,
    }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const updateProfile = (field: keyof ProfileDraft, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mini-label">Sezione personale</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Profilo e CCNL</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Scegli il contratto applicato e compila solo i dati che vuoi salvare. Queste informazioni aiutano l’analisi del cedolino.
          </p>
        </div>
        <button onClick={saveProfile} className="xpay-primary"><Save size={18} /> Salva profilo</button>
      </div>

      {saved && (
        <div className="mb-6 rounded-lg border border-xpay-mint/40 bg-xpay-mint/10 p-4 text-sm font-semibold text-xpay-mint">
          Profilo salvato in locale per la demo.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="xpay-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><BriefcaseBusiness size={18} className="text-xpay-mint" /> CCNL applicato</h2>
            <label className="relative block">
              <Search size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <input className="xpay-field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca CCNL..." />
            </label>

            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {filteredCcnl.map((item) => {
                const selected = item.code === selectedCcnl.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setSelectedCcnl(item);
                      setLevel(item.levels[0]);
                    }}
                    className="group w-24 shrink-0 text-center"
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className={`relative flex h-14 w-12 items-center justify-center rounded-lg border transition ${
                        selected ? 'border-xpay-mint bg-xpay-mint text-xpay-ink shadow-[0_0_18px_rgba(104,215,190,0.24)]' : 'border-xpay-line bg-transparent text-gray-600 group-hover:border-xpay-mint/60 group-hover:text-xpay-mint'
                      }`}>
                        <FileText size={25} />
                        {selected && (
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-xpay-ink text-xpay-mint">
                            <Check size={13} />
                          </span>
                        )}
                      </span>
                      <div className={`mt-2 min-h-8 text-wrap text-[0.68rem] font-semibold uppercase leading-4 ${selected ? 'text-xpay-mint' : 'text-gray-500'}`}>
                        {item.code.replace('CCNL-', '')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-xpay-line bg-black/15 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white">{selectedCcnl.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{selectedCcnl.code} · versione {selectedCcnl.version}</div>
                </div>
                <span className={`rounded border px-2 py-1 text-xs font-bold ${selectedCcnl.updated === 'Aggiornato' ? 'border-xpay-mint text-xpay-mint' : 'border-xpay-amber text-xpay-amber'}`}>
                  {selectedCcnl.updated}
                </span>
              </div>
            </div>
          </div>

          <div className="xpay-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-xpay-mint" /> Dettagli contratto</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm text-gray-400">Livello</span>
                <select className="xpay-field" value={level} onChange={(event) => setLevel(event.target.value)}>
                  {selectedCcnl.levels.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm text-gray-400">Tipo contratto</span>
                <select className="xpay-field" value={profile.contractType} onChange={(event) => updateProfile('contractType', event.target.value)}>
                  <option value="indeterminato">Tempo indeterminato</option>
                  <option value="determinato">Tempo determinato</option>
                  <option value="apprendistato">Apprendistato</option>
                  <option value="part-time">Part-time</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm text-gray-400">Ore settimanali</span>
                <input className="xpay-field" value={profile.weeklyHours} onChange={(event) => updateProfile('weeklyHours', event.target.value)} inputMode="decimal" />
              </label>
              <label>
                <span className="mb-1 block text-sm text-gray-400">Retribuzione base</span>
                <input className="xpay-field" value={profile.baseSalary} onChange={(event) => updateProfile('baseSalary', event.target.value)} placeholder="Facoltativa" inputMode="decimal" />
              </label>
            </div>
            <div className="mt-4">
              <MiniDateField label="Data assunzione" {...hireDate} onChange={setHireDate} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="xpay-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><UserRound size={18} className="text-xpay-mint" /> Dati personali facoltativi</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm text-gray-400">Nome</span>
                <input className="xpay-field" placeholder="Nome" value={profile.name} onChange={(event) => updateProfile('name', event.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-sm text-gray-400">Cognome</span>
                <input className="xpay-field" placeholder="Cognome" value={profile.surname} onChange={(event) => updateProfile('surname', event.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-sm text-gray-400">Email</span>
                <input className="xpay-field" type="email" placeholder="email@esempio.it" value={profile.email} onChange={(event) => updateProfile('email', event.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-sm text-gray-400">Telefono</span>
                <input className="xpay-field" placeholder="+39..." value={profile.phone} onChange={(event) => updateProfile('phone', event.target.value)} />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm text-gray-400">Codice fiscale</span>
                <input className="xpay-field uppercase" placeholder="Facoltativo" value={profile.taxCode} onChange={(event) => updateProfile('taxCode', event.target.value.toUpperCase())} />
              </label>
            </div>
            <div className="mt-4">
              <MiniDateField label="Data di nascita" {...birthDate} onChange={setBirthDate} />
            </div>
          </div>

          <div className="xpay-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><IdCard size={18} className="text-xpay-mint" /> Dati azienda</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm text-gray-400">Datore di lavoro</span>
                <input className="xpay-field" placeholder="Nome azienda" value={profile.company} onChange={(event) => updateProfile('company', event.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-sm text-gray-400">Sede di lavoro</span>
                <input className="xpay-field" placeholder="Citta" value={profile.workplace} onChange={(event) => updateProfile('workplace', event.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-sm text-gray-400">Mansione</span>
                <input className="xpay-field" placeholder="Es. addetto vendita" value={profile.role} onChange={(event) => updateProfile('role', event.target.value)} />
              </label>
            </div>
          </div>

          <div className="xpay-card border-xpay-mint/40 bg-xpay-mint/10 p-5">
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 text-xpay-mint" size={18} />
              <div>
                <div className="font-bold text-xpay-mint">Dati opzionali</div>
                <p className="mt-1 text-sm leading-6 text-gray-300">
                  Puoi lasciare vuoti i campi sensibili. Per l’audit bastano CCNL, livello, ore e turni; i dati personali servono solo per organizzare meglio storico e report.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
