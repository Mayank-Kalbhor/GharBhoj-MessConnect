/**
 * MessConnect Mobile Design System Tokens
 * Strictly adhering to docs/UI_Design_Spec_Sheet.md
 */

export const Colors = {
  // Brand
  brandPrimary: '#0F6E56',
  brandPrimaryTint: 'rgba(15, 110, 86, 0.14)',
  brandAccent: '#BA7517',
  brandAccentBg: '#FAEEDA',
  brandAccentText: '#854F0B',

  // Surfaces & Borders (Strict Flat Design: Zero Gradients, Zero Drop Shadows)
  bgScreen: '#FFFBF3', // Warm cream
  bgCard: '#FFFFFF',
  borderDefault: '#EDE7D8',
  borderMuted: '#D8D2C4',

  // Typography
  textPrimary: '#22302B',
  textSecondary: '#6B7770',

  // Status & Semantics
  successBg: '#EAF3DE',
  successText: '#3B6D11',
  dangerBg: '#FCEBEB',
  dangerText: '#791F1F',
  dangerBorder: '#E5B4A2',
} as const;

export const Typography = {
  screenTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.textPrimary,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
  },
  metadata: {
    fontSize: 11,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '500' as const,
    color: Colors.textPrimary,
  },
} as const;

export const Spacing = {
  cardPadding: 12,
  cardGap: 10,
  screenPadding: 16,
  chipPaddingHorizontal: 12,
  chipPaddingVertical: 6,
} as const;

export const Radii = {
  card: 12,
  pill: 6,
  chip: 16,
  button: 8,
  input: 8,
} as const;
