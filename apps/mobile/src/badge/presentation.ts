export type BadgeCorrectionInput = {
  startedAt: string;
  endedAt: string | null;
  reason: string;
};

type BadgeCorrectionResult =
  | { ok: true; value: BadgeCorrectionInput }
  | { ok: false; error: string };

export type BadgeCorrection = {
  previousStartedAt: string;
  previousEndedAt: string | null;
  reason: string;
  correctedAt: string;
};

export type BadgeShift = {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  corrections: BadgeCorrection[];
};

export function formatElapsed(startedAt: string, now = Date.now()): string {
  const elapsedSeconds = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

export function buildBadgeCorrection(
  startedAtInput: string,
  endedAtInput: string,
  reasonInput: string,
): BadgeCorrectionResult {
  const startedAt = startedAtInput.trim();
  const endedAt = endedAtInput.trim() || null;
  const reason = reasonInput.trim();

  if (reason.length < 3) {
    return { ok: false, error: 'Inserisci una motivazione di almeno 3 caratteri.' };
  }
  if (!Number.isFinite(Date.parse(startedAt)) || (endedAt && !Number.isFinite(Date.parse(endedAt)))) {
    return { ok: false, error: 'Inserisci date e orari ISO validi.' };
  }
  if (endedAt && Date.parse(endedAt) <= Date.parse(startedAt)) {
    return { ok: false, error: 'La fine deve essere successiva all’inizio.' };
  }

  return { ok: true, value: { startedAt, endedAt, reason } };
}
