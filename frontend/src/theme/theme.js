import { Dimensions } from 'react-native';

export const COLORS = {
  primary: '#00A99D', // Empylo Turquoise
  secondary: '#FFB347', // Empylo Orange
  background: '#F8F9FA',
  white: '#FFFFFF', // Empylo White
  black: '#191919', // Empylo Black
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  error: '#DC3545',
  success: '#28A745',
  text: '#191919', // Using Empylo Black for text
  placeholder: '#ADB5BD',
  border: '#CED4DA',
  lightPurple: '#A5A7F4', // Empylo Light Purple
  lightBlue: '#D8DEE8', // Empylo Light Blue
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 30,
  pill: 999,
};

export const TYPOGRAPHY = {
  h1: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    color: COLORS.text,
  },
  h2: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 24,
    color: COLORS.text,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: COLORS.text,
  },
  caption: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.gray,
  },
};

// Export theme object for components that use `theme.` notation
export const theme = {
  colors: {
    card: COLORS.white,
    canvas: COLORS.background,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    text: COLORS.text,
    brand: COLORS.primary,
    ink: COLORS.text,
    inkMuted: COLORS.gray,
    divider: COLORS.border,
    brandSoft: COLORS.lightGray,
    brandDark: COLORS.primary,
    ...COLORS,
  },
  space: SPACING,
  radius: RADIUS,
  typography: {
    ...TYPOGRAPHY,
    title: 'SpaceGrotesk_700Bold',
    body: 'DMSans_400Regular',
    bodyMedium: 'DMSans_500Medium',
  },
};
