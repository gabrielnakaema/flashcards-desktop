const DEV_CLOCK_STORAGE_KEY = "flashcards:dev-clock-now";

const NativeDate = globalThis.Date;
let activeTimeMs: number | null = null;

const readStoredTime = (): number | null => {
  try {
    const stored = globalThis.localStorage?.getItem(DEV_CLOCK_STORAGE_KEY);
    if (!stored) return null;

    const parsed = NativeDate.parse(stored);
    return Number.isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
};

const writeStoredTime = (timeMs: number): void => {
  globalThis.localStorage?.setItem(
    DEV_CLOCK_STORAGE_KEY,
    new NativeDate(timeMs).toISOString()
  );
};

const clearStoredTime = (): void => {
  globalThis.localStorage?.removeItem(DEV_CLOCK_STORAGE_KEY);
};

const makeDateConstructor = (timeMs: number): DateConstructor => {
  function DevDate(this: Date, ...args: unknown[]) {
    if (!new.target) {
      return new NativeDate(timeMs).toString();
    }

    if (args.length === 0) {
      return new NativeDate(timeMs);
    }

    return Reflect.construct(NativeDate, args, new.target);
  }

  Object.setPrototypeOf(DevDate, NativeDate);
  DevDate.prototype = NativeDate.prototype;
  DevDate.now = () => timeMs;
  DevDate.parse = NativeDate.parse;
  DevDate.UTC = NativeDate.UTC;

  return DevDate as DateConstructor;
};

const applyDateOverride = (timeMs: number): void => {
  activeTimeMs = timeMs;
  globalThis.Date = makeDateConstructor(timeMs);
};

const parseTimeValue = (value: string | number | Date): number => {
  if (typeof value === "number") {
    return value;
  }

  if (value instanceof NativeDate) {
    return value.getTime();
  }

  return NativeDate.parse(value);
};

export const initializeDevClock = (): number | null => {
  const storedTimeMs = readStoredTime();

  if (storedTimeMs === null) {
    clearDevClock();
    return null;
  }

  applyDateOverride(storedTimeMs);
  return storedTimeMs;
};

export const getDevClockTime = (): number | null => activeTimeMs;

export const setDevClockTime = (value: string | number | Date): number => {
  const timeMs = parseTimeValue(value);

  if (Number.isNaN(timeMs)) {
    throw new Error("Enter a valid date and time.");
  }

  writeStoredTime(timeMs);
  applyDateOverride(timeMs);
  return timeMs;
};

export const advanceDevClock = (durationMs: number): number => {
  const nextTimeMs = (activeTimeMs ?? NativeDate.now()) + durationMs;
  return setDevClockTime(nextTimeMs);
};

export const clearDevClock = (): void => {
  activeTimeMs = null;
  globalThis.Date = NativeDate;
  clearStoredTime();
};

export const formatDevClockInputValue = (timeMs: number | null): string => {
  if (timeMs === null) return "";
  const date = new NativeDate(timeMs);
  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join(
      "-"
    ) + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};

export const formatDevClockDisplayValue = (timeMs: number | null): string => {
  if (timeMs === null) return "Real time";
  return new NativeDate(timeMs).toLocaleString();
};
