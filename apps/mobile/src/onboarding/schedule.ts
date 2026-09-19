export type WorkDay = {
  day: number;
  enabled: boolean;
  start: string | null;
  end: string | null;
};

export type WeeklySchedule = WorkDay[];

export function createEmptyWeek(): WeeklySchedule {
  return Array.from({ length: 7 }, (_, index) => ({
    day: index + 1,
    enabled: false,
    start: null,
    end: null,
  }));
}

export function updateWorkDay(
  schedule: WeeklySchedule,
  day: number,
  patch: Partial<Omit<WorkDay, 'day'>>,
): WeeklySchedule {
  return schedule.map((workDay) => {
    if (workDay.day !== day) return workDay;

    const updated = { ...workDay, ...patch };
    return updated.enabled ? updated : { ...updated, start: null, end: null };
  });
}
