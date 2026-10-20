import { acquireCountdown, COUNTDOWN_START, countdownParts, getCountdown, resetCountdown, subscribeCountdown } from '@/lib/countdown';

beforeEach(() => {
  jest.useFakeTimers();
  resetCountdown();
});
afterEach(() => {
  resetCountdown();
  jest.useRealTimers();
});

it('starts at 15:00 and ticks once a second while a screen is focused', () => {
  expect(getCountdown()).toBe(COUNTDOWN_START);
  const release = acquireCountdown();
  jest.advanceTimersByTime(3000);
  expect(getCountdown()).toBe(COUNTDOWN_START - 3);
  release();
});

it('shares one interval between screens and clears it only when the last one lets go', () => {
  const first = acquireCountdown();
  const second = acquireCountdown();
  // Two focused screens still tick once per second, not twice.
  jest.advanceTimersByTime(1000);
  expect(getCountdown()).toBe(COUNTDOWN_START - 1);
  expect(jest.getTimerCount()).toBe(1);
  first();
  jest.advanceTimersByTime(1000);
  expect(getCountdown()).toBe(COUNTDOWN_START - 2);
  second();
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(5000);
  expect(getCountdown()).toBe(COUNTDOWN_START - 2);
});

it('keeps the time while nobody is focused and resumes from there', () => {
  let release = acquireCountdown();
  jest.advanceTimersByTime(10_000);
  release();
  jest.advanceTimersByTime(60_000);
  expect(getCountdown()).toBe(COUNTDOWN_START - 10);
  release = acquireCountdown();
  jest.advanceTimersByTime(1000);
  expect(getCountdown()).toBe(COUNTDOWN_START - 11);
  release();
});

it('ignores a double release', () => {
  const release = acquireCountdown();
  const other = acquireCountdown();
  release();
  release();
  other();
  expect(jest.getTimerCount()).toBe(0);
  expect(() => acquireCountdown()()).not.toThrow();
});

it('starts over after zero', () => {
  const release = acquireCountdown();
  jest.advanceTimersByTime(COUNTDOWN_START * 1000);
  expect(getCountdown()).toBe(0);
  jest.advanceTimersByTime(1000);
  expect(getCountdown()).toBe(COUNTDOWN_START);
  release();
});

it('tells subscribers about each tick and stops after unsubscribe', () => {
  const listener = jest.fn();
  const unsubscribe = subscribeCountdown(listener);
  const release = acquireCountdown();
  jest.advanceTimersByTime(2000);
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
  jest.advanceTimersByTime(2000);
  expect(listener).toHaveBeenCalledTimes(2);
  release();
});

it('splits seconds into padded minutes and seconds', () => {
  expect(countdownParts(900)).toEqual({ min: '15', sec: '00' });
  expect(countdownParts(59)).toEqual({ min: '00', sec: '59' });
  expect(countdownParts(527)).toEqual({ min: '08', sec: '47' });
});
