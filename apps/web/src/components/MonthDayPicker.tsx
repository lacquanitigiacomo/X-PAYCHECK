type DayMarker = {
  short: string;
  tone: string;
};

type MonthDayPickerProps = {
  daysInMonth: number;
  monthLabel: string;
  selectedDay: number;
  markers?: Record<number, DayMarker[]>;
  onSelectDay: (day: number) => void;
  compact?: boolean;
  numberGrid?: boolean;
  fadeUnselected?: boolean;
  hideHeader?: boolean;
};

const weekdays = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

export default function MonthDayPicker({
  daysInMonth,
  monthLabel,
  selectedDay,
  markers = {},
  onSelectDay,
  compact = false,
  numberGrid = false,
  fadeUnselected = false,
  hideHeader = false,
}: MonthDayPickerProps) {
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  if (numberGrid) {
    return (
      <div>
        {!hideHeader && (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-white">{monthLabel}</span>
            <span className="text-xs text-gray-500">{selectedDay} {monthLabel}</span>
          </div>
        )}

        <div className="flex max-w-[18rem] flex-wrap justify-start gap-1.5">
          {days.map((day) => {
            const selected = day === selectedDay;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold transition ${
                  selected
                    ? 'border-xpay-mint bg-xpay-mint text-xpay-ink shadow-[0_0_0_3px_rgba(104,215,190,0.14)]'
                    : `border-xpay-line bg-xpay-soft text-gray-300 hover:border-xpay-mint/60 hover:text-white ${fadeUnselected ? 'opacity-35' : ''}`
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-white">{monthLabel}</span>
        <span className="text-xs text-gray-500">{selectedDay} {monthLabel}</span>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold text-gray-500">
        {weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dayMarkers = markers[day] || [];
          const selected = day === selectedDay;
          const primary = dayMarkers[0];

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`rounded-lg border bg-xpay-soft text-left transition hover:border-xpay-mint/60 ${
                compact ? 'min-h-12 p-1.5' : 'min-h-24 p-2'
              } ${selected ? 'border-xpay-mint ring-2 ring-xpay-mint/20' : primary ? primary.tone : 'border-xpay-line text-gray-300'}`}
            >
              <span className="text-sm font-bold">{day}</span>
              {dayMarkers.length > 0 && (
                <span className={`${compact ? 'mt-1' : 'mt-3'} flex flex-wrap gap-1`}>
                  {dayMarkers.slice(0, compact ? 2 : 3).map((marker, index) => (
                    <span key={`${marker.short}-${index}`} className={`rounded border px-1 py-0.5 text-[0.6rem] font-bold ${marker.tone}`}>
                      {marker.short}
                    </span>
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
