import { Platform } from 'react-native';
import * as ExpoFont from 'expo-font';

const FONT_ROLE_CANDIDATES = {
  bodyRegular: Platform.select({
    ios: ['DMSans-Regular', 'DMSans_400Regular', 'DM Sans'],
    android: ['DMSans_400Regular', 'DMSans-Regular', 'DM Sans'],
    default: ['DMSans_400Regular', 'DMSans-Regular', 'DM Sans'],
  }),
  bodyMedium: Platform.select({
    ios: ['DMSans-Medium', 'DMSans_500Medium', 'DM Sans Medium'],
    android: ['DMSans_500Medium', 'DMSans-Medium', 'DM Sans Medium'],
    default: ['DMSans_500Medium', 'DMSans-Medium', 'DM Sans Medium'],
  }),
  bodyBold: Platform.select({
    ios: ['DMSans-Bold', 'DMSans_700Bold', 'DM Sans Bold'],
    android: ['DMSans_700Bold', 'DMSans-Bold', 'DM Sans Bold'],
    default: ['DMSans_700Bold', 'DMSans-Bold', 'DM Sans Bold'],
  }),
  displaySemiBold: Platform.select({
    ios: ['SpaceGrotesk-SemiBold', 'SpaceGrotesk_600SemiBold', 'Space Grotesk SemiBold'],
    android: ['SpaceGrotesk_600SemiBold', 'SpaceGrotesk-SemiBold', 'Space Grotesk SemiBold'],
    default: ['SpaceGrotesk_600SemiBold', 'SpaceGrotesk-SemiBold', 'Space Grotesk SemiBold'],
  }),
  displayBold: Platform.select({
    ios: ['SpaceGrotesk-Bold', 'SpaceGrotesk_700Bold', 'Space Grotesk Bold'],
    android: ['SpaceGrotesk_700Bold', 'SpaceGrotesk-Bold', 'Space Grotesk Bold'],
    default: ['SpaceGrotesk_700Bold', 'SpaceGrotesk-Bold', 'Space Grotesk Bold'],
  }),
};

const FONT_FALLBACK_WEIGHTS = {
  bodyRegular: undefined,
  bodyMedium: '500',
  bodyBold: '700',
  displaySemiBold: '700',
  displayBold: '800',
};

const FONT_FALLBACK_FAMILIES = {
  bodyRegular: undefined,
  bodyMedium: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
  bodyBold: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
  displaySemiBold: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
  displayBold: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
};

let diagnosticsCache = null;
let diagnosticsLogged = false;

const getLoadedFontFamilies = () => {
  try {
    return typeof ExpoFont.getLoadedFonts === 'function' ? ExpoFont.getLoadedFonts() : [];
  } catch {
    return [];
  }
};

const computeFontDiagnostics = () => {
  const loadedFonts = getLoadedFontFamilies();
  const loadedFontSet = new Set(loadedFonts);

  const brandFontFamilies = Object.fromEntries(
    Object.entries(FONT_ROLE_CANDIDATES).map(([role, candidates]) => {
      const resolved = (candidates || []).find((candidate) => loadedFontSet.has(candidate));
      return [role, resolved];
    })
  );

  return {
    loadedFonts,
    brandFontFamilies,
    hasCustomBrandFonts: Object.values(brandFontFamilies).some(Boolean),
  };
};

export const getFontDiagnostics = () => {
  if (!diagnosticsCache) {
    diagnosticsCache = computeFontDiagnostics();
  }
  return diagnosticsCache;
};

export const logFontDiagnostics = () => {
  if (__DEV__ && !diagnosticsLogged) {
    diagnosticsLogged = true;
    const diagnostics = getFontDiagnostics();
    console.log('[Typography] Font availability', {
      loadedFonts: diagnostics.loadedFonts,
      brandFontFamilies: diagnostics.brandFontFamilies,
    });
  }
};

const diagnostics = getFontDiagnostics();

export const BRAND_FONT_FAMILIES = diagnostics.brandFontFamilies;

export const FONT_FAMILIES = {
  bodyRegular: BRAND_FONT_FAMILIES.bodyRegular || FONT_FALLBACK_FAMILIES.bodyRegular,
  bodyMedium: BRAND_FONT_FAMILIES.bodyMedium || FONT_FALLBACK_FAMILIES.bodyMedium,
  bodyBold: BRAND_FONT_FAMILIES.bodyBold || FONT_FALLBACK_FAMILIES.bodyBold,
  displaySemiBold: BRAND_FONT_FAMILIES.displaySemiBold || FONT_FALLBACK_FAMILIES.displaySemiBold,
  displayBold: BRAND_FONT_FAMILIES.displayBold || FONT_FALLBACK_FAMILIES.displayBold,
};

export const FONT_STYLES = {
  bodyRegular: FONT_FAMILIES.bodyRegular ? { fontFamily: FONT_FAMILIES.bodyRegular } : {},
  bodyMedium: FONT_FAMILIES.bodyMedium
    ? { fontFamily: FONT_FAMILIES.bodyMedium }
    : { fontWeight: FONT_FALLBACK_WEIGHTS.bodyMedium },
  bodyBold: FONT_FAMILIES.bodyBold
    ? { fontFamily: FONT_FAMILIES.bodyBold }
    : { fontWeight: FONT_FALLBACK_WEIGHTS.bodyBold },
  displaySemiBold: FONT_FAMILIES.displaySemiBold
    ? { fontFamily: FONT_FAMILIES.displaySemiBold }
    : { fontWeight: FONT_FALLBACK_WEIGHTS.displaySemiBold },
  displayBold: FONT_FAMILIES.displayBold
    ? { fontFamily: FONT_FAMILIES.displayBold }
    : { fontWeight: FONT_FALLBACK_WEIGHTS.displayBold },
};
