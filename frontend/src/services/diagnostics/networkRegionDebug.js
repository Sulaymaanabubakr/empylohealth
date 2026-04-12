import { supabaseFunctionUrl } from '../supabase/supabaseClient';

export const logNetworkRegionDebug = () => {
    if (!__DEV__) return;

    console.log('[NetworkRegionDebug] Function base URL:', supabaseFunctionUrl('health').replace(/\/health$/, ''));
    console.log('[NetworkRegionDebug] Backend provider:', 'supabase');
};
