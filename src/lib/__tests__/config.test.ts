import { resolveEnv } from '@/config';

describe('resolveEnv', () => {
  it('treats api-staging and staging-api hosts as staging', () => {
    for (const url of ['https://api-staging.runmeal.com/api', 'https://staging-api.runmeal.com']) {
      const env = resolveEnv(url);
      expect(env.isStaging).toBe(true);
      expect(env.portalWebOrigin).toBe('https://staging-portalfe.runmeal.com');
      expect(env.recaptchaSiteKey).toBe('6LdNQdctAAAAAEUyqV33UzBZShZrRpmcnMu-Rgca');
      expect(env.googleWebClientId).toBe('709162763845-i8m3ql8e9a32kmrntm4gibru2kr6hktm.apps.googleusercontent.com');
    }
  });

  it('uses production values for api.runmeal.com', () => {
    const env = resolveEnv('https://api.runmeal.com');
    expect(env.isStaging).toBe(false);
    expect(env.portalWebOrigin).toBe('https://portalfe.runmeal.com');
    expect(env.recaptchaSiteKey).toBe('6LcI-r4tAAAAACBuj3v6pG8RBJmXW2RA132gGjJI');
    expect(env.googleWebClientId).toBe('709162763845-204l0a59busg4vglg9uv24aphlaq9j7r.apps.googleusercontent.com');
  });
});

describe('API_URL default', () => {
  it('talks to the staging API host directly when EXPO_PUBLIC_API_URL is unset', () => {
    const saved = process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;
    try {
      // API_URL is read at import time, so load a fresh module graph after clearing the env var.
      jest.isolateModules(() => {
        const config = jest.requireActual<typeof import('@/config')>('@/config');
        expect(config.API_URL).toBe('https://staging-api.runmeal.com');
      });
    } finally {
      if (saved !== undefined) process.env.EXPO_PUBLIC_API_URL = saved;
    }
  });
});
