const AUTH_PUBLIC_ROUTES = new Set([
  'Splash',
  'Onboarding',
  'SignIn',
  'SignUp',
  'ForgotPassword',
  'ResetPassword',
  'Verification'
]);

const PROTECTED_ROUTES = new Set([
  // Home / feed / personal content
  'Dashboard',
  'Explore',
  'Notifications',
  'ActivityDetail',
  'Affirmations',

  // Chats and calls
  'ChatList',
  'ChatDetail',
  'Huddle',
  'IncomingHuddle',

  // Circles and member data
  'SupportGroups',
  'CreateCircle',
  'CircleDetail',
  'CircleAnalysis',
  'CircleSettings',
  'PublicProfile',

  // Personal profile / account
  'Profile',
  'PersonalInformation',
  'Security',
  'NotificationsSettings',
  'TellAFriend',
  'Stats',
  'Assessment'
]);

export const isProtectedRoute = (routeName, { enhancedPrivacyMode = false } = {}) => {
  const name = String(routeName || '').trim();
  if (!name) return false;
  if (PROTECTED_ROUTES.has(name)) return true;

  // Optional stricter mode protects every authenticated screen.
  if (enhancedPrivacyMode) {
    return !AUTH_PUBLIC_ROUTES.has(name);
  }

  return false;
};

export const getProtectedRoutes = () => [...PROTECTED_ROUTES];
