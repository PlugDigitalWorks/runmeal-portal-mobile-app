import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { CaptchaSheet } from '@/components/CaptchaSheet';

/**
 * Ask for a reCAPTCHA token only when an action needs one. `requestToken` opens
 * the sheet and resolves with the token, or with null when the person closes it
 * (so the caller sends nothing). Render `sheet` once anywhere in the screen.
 */
export function useCaptcha(): { requestToken: () => Promise<string | null>; sheet: ReactElement } {
  const [open, setOpen] = useState(false);
  // A token works once; a new key mounts a fresh sheet and widget for every request.
  const [run, setRun] = useState(0);
  const pending = useRef<((token: string | null) => void) | null>(null);

  const settle = useCallback((token: string | null) => {
    const resolve = pending.current;
    pending.current = null;
    setOpen(false);
    resolve?.(token);
  }, []);

  const requestToken = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        pending.current?.(null);
        pending.current = resolve;
        setRun((n) => n + 1);
        setOpen(true);
      }),
    [],
  );

  const onToken = useCallback((token: string) => settle(token), [settle]);
  const onClose = useCallback(() => settle(null), [settle]);

  // Leaving the screen with the sheet open must not leave a caller waiting forever.
  useEffect(() => () => pending.current?.(null), []);

  return { requestToken, sheet: <CaptchaSheet key={run} visible={open} onToken={onToken} onClose={onClose} /> };
}
