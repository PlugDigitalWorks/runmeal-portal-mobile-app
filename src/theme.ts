/** "Sıcak Runmeal" tokens (spec §4): portalfe's orange scale on a cream canvas. */
export const colors = {
  primary: '#F5A623',
  primaryPressed: '#E28900',
  primaryForeground: '#FFFFFF',
  primarySoft: '#FFF1DF',
  primarySoftForeground: '#E28900',
  /** Promo strips on restaurant cards: Runmeal's deeper orange, readable under white text. */
  promo: '#E28900',
  background: '#FFFAF5',
  card: '#FFFFFF',
  border: '#F2E6D7',
  searchFill: '#F4EEE7',
  bannerPlaceholder: '#FFE3BF',
  foreground: '#10192E',
  mutedForeground: '#6B6257',
  subtle: '#9A8F82',
  destructive: '#EF4444',
  destructiveSoft: '#FEF2F2',
  success: '#16A34A',
  successSoft: '#F0FDF4',
  overlay: 'rgba(16,25,46,0.45)',
} as const;

export const radius = { sm: 6, md: 10, lg: 16, xl: 20, full: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
export const font = { caption: 11, small: 12, body: 14, base: 16, title: 18, heading: 22, display: 28 } as const;
export const weight = { regular: '400', semibold: '600', bold: '700' } as const;

export const shadow = {
  card: {
    shadowColor: '#7A4A00',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
