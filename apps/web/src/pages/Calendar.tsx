import { useMemo, useState } from 'react';
import { CalendarDays, Clock, Moon, Pencil, Plus, SunMedium, Trash2, X } from 'lucide-react';
import MonthDayPicker from '../components/MonthDayPicker';

type ShiftFlag = 'ordinary' | 'overtime' | 'night' | 'holiday' | 'rest';

type Shift = {
  id: string;
  day: number;
  flags: ShiftFlag[];
  start: string;
  end: string;
  breakMinutes: number;
  note: string;
};

const shiftOptions: Record<ShiftFlag, { label: string; short: string; tone: string }> = {
  ordinary: { label: 'Ordinario', short: 'O', tone: 'border-xpay-mint text-xpay-mint' },
  overtime: { label: 'Straordinario', short: 'S', tone: 'border-xpay-amber text-xpay-amber' },
  night: { label: 'Notturno', short: 'N', tone: 'border-xpay-cyan text-xpay-cyan' },
  holiday: { label: 'Festivo', short: 'F', tone: 'border-xpay-coral text-xpay-coral' },
  rest: { label: 'Riposo', short: 'R', tone: 'border-gray-600 text-gray-500' },
};

const initialShifts: Shift[] = [
  { id: 'demo-2', day: 2, flags: ['ordinary', 'night'], start: '22:00', end: '06:00', breakMinutes: 30, note: 'Turno notte' },
  { id: 'demo-6', day: 6, flags: ['ordinary', 'holiday'], start: '14:00', end: '22:00', breakMinutes: 30, note: 'Festivo lavorato' },
  { id: 'demo-10', day: 10, flags: ['ordinary', 'overtime'], start: '09:00', end: '19:00', breakMinutes: 60, note: 'Chiusura inventario' },
  { id: 'demo-14', day: 14, flags: ['ordinary', 'night'], start: '22:00', end: '06:00', breakMinutes: 30, note: '' },
  { id: 'demo-25', day: 25, flags: ['ordinary', 'holiday'], start: '14:00', end: '22:00', breakMinutes: 30, note: '25 Aprile' },
];

function hoursBetween(start: string, end: string, breakMinutes: number) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;

  if (endTotal <= startTotal) endTotal += 24 * 60;

  return Math.max(0, (endTotal - startTotal - breakMinutes) / 60);
}

export default function Calendar() {
  const [selectedDay, setSelectedDay] = useState(10);
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [flags, setFlags] = useState<ShiftFlag[]>(['ordinary']);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [note, setNote] = useState('');

  const shiftsByDay = useMemo(() => {
    return shifts.reduce<Record<number, Shift[]>>((acc, shift) => {
      acc[shift.day] = [...(acc[shift.day] || []), shift];
      return acc;
    }, {});
  }, [shifts]);

  const dayMarkers = useMemo(() => {
    return Object.fromEntries(
      Object.entries(shiftsByDay).map(([day, dayShifts]) => [
        Number(day),
        dayShifts.flatMap((shift) =>
          shift.flags.map((flag) => ({
            short: shiftOptions[flag].short,
            tone: shiftOptions[flag].tone,
          }))
        ),
      ])
    );
  }, [shiftsByDay]);

  const selectedShifts = shiftsByDay[selectedDay] || [];

  const summary = useMemo(() => {
    return shifts.reduce(
      (acc, shift) => {
        const hours = shift.flags.includes('rest') ? 0 : hoursBetween(shift.start, shift.end, shift.breakMinutes);
        if (shift.flags.includes('ordinary')) acc.ordinary += hours;
        if (shift.flags.includes('overtime')) acc.overtime += hours;
        if (shift.flags.includes('night')) acc.night += hours;
        if (shift.flags.includes('holiday')) acc.holiday += 1;
        return acc;
      },
      { ordinary: 0, overtime: 0, night: 0, holiday: 0 }
    );
  }, [shifts]);

  const isRest = flags.includes('rest');
  const previewHours = isRest ? 0 : hoursBetween(start, end, breakMinutes);

  const toggleFlag = (flag: ShiftFlag) => {
    setFlags((current) => {
      if (flag === 'rest') return current.includes('rest') ? ['ordinary'] : ['rest'];
      const withoutRest = current.filter((item) => item !== 'rest');
      const next = withoutRest.includes(flag)
        ? withoutRest.filter((item) => item !== flag)
        : [...withoutRest, flag];
      return next.length ? next : ['ordinary'];
    });
  };

  const resetForm = () => {
    setEditingShiftId(null);
    setFlags(['ordinary']);
    setStart('09:00');
    setEnd('17:00');
    setBreakMinutes(30);
    setNote('');
  };

  const editShift = (shift: Shift) => {
    setSelectedDay(shift.day);
    setFlags(shift.flags);
    setStart(shift.start);
    setEnd(shift.end);
    setBreakMinutes(shift.breakMinutes);
    setNote(shift.note);
    setEditingShiftId(shift.id);
    setActiveTab('add');
  };

  const saveShift = () => {
    const nextShift: Shift = {
      id: editingShiftId || `shift-${Date.now()}`,
      day: selectedDay,
      flags,
      start,
      end,
      breakMinutes,
      note,
    };

    setShifts((current) => editingShiftId
      ? current.map((shift) => shift.id === editingShiftId ? nextShift : shift)
      : [...current, nextShift]
    );
    setEditingShiftId(null);
    setNote('');
  };

  const deleteShift = (id: string) => {
    setShifts((current) => current.filter((shift) => shift.id !== id));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div>
          <p className="mini-label">Turni e calendario</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Aprile 2026</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Inserisci e controlla i turni del mese. Il calendario completo resta sotto come vista di riepilogo.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="xpay-card p-5">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-bold">Gestione turni</h2>
              <p className="mt-1 text-sm text-gray-500">Lavora sul giorno selezionato: {selectedDay} Aprile.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-xpay-line bg-black/20 p-1">
              {[
                ['list', 'Turni del giorno'],
                ['add', 'Aggiungi turno'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value as 'list' | 'add')}
                  className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                    activeTab === value ? 'bg-xpay-mint text-xpay-ink' : 'text-gray-400 hover:bg-xpay-soft hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'list' ? (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-300">Turni del {selectedDay} Aprile</h3>
              {selectedShifts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-xpay-line p-6 text-center text-sm text-gray-500">
                  Nessun turno inserito per questo giorno.
                </div>
              ) : (
                <div className="grid gap-3">
                  {selectedShifts.map((shift) => (
                    <div key={shift.id} className="rounded-lg border border-xpay-line bg-xpay-soft p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap gap-1.5">
                            {shift.flags.map((flag) => (
                              <span key={flag} className={`rounded border px-2 py-1 text-xs font-bold ${shiftOptions[flag].tone}`}>
                                {shiftOptions[flag].label}
                              </span>
                            ))}
                          </div>
                          <div className="mt-1 text-sm text-gray-300">
                            {shift.flags.includes('rest')
                              ? 'Giorno di riposo'
                              : `${shift.start} - ${shift.end} · pausa ${shift.breakMinutes} min · ${hoursBetween(shift.start, shift.end, shift.breakMinutes).toFixed(1)} ore`}
                          </div>
                          {shift.note && <p className="mt-2 text-sm text-gray-500">{shift.note}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => editShift(shift)} className="rounded-lg border border-xpay-line p-2 text-gray-500 transition hover:border-xpay-mint hover:text-xpay-mint" aria-label="Modifica turno">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => deleteShift(shift.id)} className="rounded-lg border border-xpay-line p-2 text-gray-500 transition hover:border-xpay-coral hover:text-xpay-coral" aria-label="Elimina turno">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(260px,2fr)_minmax(0,3fr)]">
              <div>
                <span className="mb-2 block text-sm font-semibold text-gray-300">Calendario</span>
                <div className="rounded-lg border border-xpay-line bg-black/15 p-3">
                  <div className="mb-4 rounded-lg border border-xpay-mint/30 bg-xpay-mint/10 p-4">
                    <div className="text-xs font-semibold uppercase text-xpay-mint">Giorno selezionato</div>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div className="text-5xl font-black leading-none text-white">{selectedDay}</div>
                      <div className="text-right">
                        <div className="font-bold text-white">Aprile 2026</div>
                        <div className="text-xs text-gray-500">tocca un numero per cambiare</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <MonthDayPicker
                      daysInMonth={30}
                      monthLabel="Aprile"
                      selectedDay={selectedDay}
                      onSelectDay={setSelectedDay}
                      compact
                      numberGrid
                      fadeUnselected
                      hideHeader
                    />
                  </div>
                </div>
              </div>

              <div className="lg:border-l lg:border-xpay-line lg:pl-6">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="block text-sm font-semibold text-gray-300">
                    {editingShiftId ? 'Modifica turno' : 'Informazioni turno'}
                  </span>
                  {editingShiftId && (
                    <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-lg border border-xpay-line px-2.5 py-1.5 text-xs font-bold text-gray-400 transition hover:border-xpay-mint hover:text-white">
                      <X size={14} /> Annulla
                    </button>
                  )}
                </div>
                <div className="grid gap-4">
                  <div>
                    <span className="mb-2 block text-xs font-semibold uppercase text-gray-500">Tipologie</span>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(shiftOptions) as ShiftFlag[]).map((flag) => {
                        const active = flags.includes(flag);
                        return (
                          <button
                            key={flag}
                            type="button"
                            onClick={() => toggleFlag(flag)}
                            className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                              active
                                ? `${shiftOptions[flag].tone} bg-xpay-soft`
                                : 'border-xpay-line bg-black/15 text-gray-500 hover:border-xpay-mint/50 hover:text-gray-200'
                            }`}
                          >
                            {shiftOptions[flag].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.9fr]">
                    <label className={`block ${isRest ? 'opacity-45' : ''}`}>
                      <span className="mb-1 block text-sm text-gray-400">Inizio</span>
                      <input className="xpay-field !py-2.5" type="time" value={start} onChange={(event) => setStart(event.target.value)} disabled={isRest} />
                    </label>
                    <label className={`block ${isRest ? 'opacity-45' : ''}`}>
                      <span className="mb-1 block text-sm text-gray-400">Fine</span>
                      <input className="xpay-field !py-2.5" type="time" value={end} onChange={(event) => setEnd(event.target.value)} disabled={isRest} />
                    </label>
                    <label className={`block ${isRest ? 'opacity-45' : ''}`}>
                      <span className="mb-1 block text-sm text-gray-400">Pausa</span>
                      <select className="xpay-field !py-2.5" value={breakMinutes} onChange={(event) => setBreakMinutes(Number(event.target.value))} disabled={isRest}>
                        {[0, 15, 30, 45, 60, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-sm text-gray-400">Note</span>
                    <input className="xpay-field !py-2.5" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Es. cambio turno, inventario, festivo..." />
                  </label>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="rounded-lg border border-xpay-line bg-xpay-soft px-4 py-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ore calcolate</span>
                        <span className="font-mono font-bold text-xpay-mint">{previewHours.toFixed(1)}</span>
                      </div>
                    </div>
                    <button onClick={saveShift} className="xpay-primary w-full md:w-auto">
                      {editingShiftId ? <Pencil size={18} /> : <Plus size={18} />}
                      {editingShiftId ? 'Aggiorna turno' : 'Salva turno'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="xpay-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><CalendarDays size={18} className="text-xpay-mint" /> Riepilogo mese</h2>
            {[
              ['Ore ordinarie', summary.ordinary.toFixed(1)],
              ['Straordinari', summary.overtime.toFixed(1)],
              ['Ore notturne', summary.night.toFixed(1)],
              ['Festivi lavorati', String(summary.holiday)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-xpay-line py-3 text-sm last:border-0">
                <span className="text-gray-400">{label}</span>
                <span className="font-mono font-bold">{value}</span>
              </div>
            ))}
          </div>

          <div className="xpay-card p-5">
            <h2 className="mb-4 font-bold">Pattern rilevati</h2>
            {[
              { icon: <Moon size={16} />, label: 'Notturni inseriti', value: `${summary.night.toFixed(1)} ore` },
              { icon: <SunMedium size={16} />, label: 'Festivi lavorati', value: `${summary.holiday} giorni` },
              { icon: <Clock size={16} />, label: 'Turni totali', value: `${shifts.length}` },
            ].map((item) => (
              <div key={item.label} className="mb-3 flex items-center justify-between rounded-lg bg-xpay-soft px-3 py-3 text-sm last:mb-0">
                <span className="flex items-center gap-2 text-gray-300"><span className="text-xpay-mint">{item.icon}</span>{item.label}</span>
                <span className="text-xs text-gray-500">{item.value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="xpay-card mt-6 p-5">
        <div className="mb-5">
          <h2 className="font-bold">Calendario mensile</h2>
          <p className="mt-1 text-sm text-gray-500">Vista completa dei turni inseriti e dei giorni con anomalie potenziali.</p>
        </div>
        <MonthDayPicker
          daysInMonth={30}
          monthLabel="Aprile"
          selectedDay={selectedDay}
          markers={dayMarkers}
          onSelectDay={setSelectedDay}
        />
      </section>
    </div>
  );
}
