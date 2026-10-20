/**
 * The (mock) offer countdown, shared by the strip on Keşfet and the header card of /deals so both show
 * the same live time. One interval serves however many screens are focused; it stops when none is, and
 * the time is kept, so a screen that comes back shows where the clock stood.
 */
export const COUNTDOWN_START = 15 * 60;

let left = COUNTDOWN_START;
let timer: ReturnType<typeof setInterval> | null = null;
let focused = 0;
const listeners = new Set<() => void>();

const tick = () => {
  left = left <= 0 ? COUNTDOWN_START : left - 1;
  listeners.forEach((l) => l());
};

export const getCountdown = () => left;

export function subscribeCountdown(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A screen came into focus: tick while at least one is. Returns the matching "went out of focus". */
export function acquireCountdown() {
  focused += 1;
  if (!timer) timer = setInterval(tick, 1000);
  return () => {
    focused -= 1;
    if (focused <= 0 && timer) {
      clearInterval(timer);
      timer = null;
      focused = 0;
    }
  };
}

/** Back to 15:00 with nothing ticking; for tests. */
export function resetCountdown() {
  if (timer) clearInterval(timer);
  timer = null;
  focused = 0;
  left = COUNTDOWN_START;
  listeners.forEach((l) => l());
}

export const countdownParts = (seconds: number) => ({
  min: String(Math.floor(seconds / 60)).padStart(2, '0'),
  sec: String(seconds % 60).padStart(2, '0'),
});
