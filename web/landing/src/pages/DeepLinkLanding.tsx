import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

const APP_STORE_URL = (import.meta.env.VITE_APP_STORE_URL as string | undefined) || 'https://apps.apple.com';
const PLAY_STORE_URL = (import.meta.env.VITE_PLAY_STORE_URL as string | undefined) || 'https://play.google.com/store/apps/details?id=com.empylo.circlesapp';
const CANONICAL_BASE = (import.meta.env.VITE_CANONICAL_WEB_URL as string | undefined) || 'https://empylo.com';

const DeepLinkLanding = () => {
  const location = useLocation();
  const params = useParams<{ route: string; id: string }>();
  const route = String(location.pathname.split('/').filter(Boolean)[0] || '').trim().toLowerCase();
  const id = encodeURIComponent(String(params.id || '').trim());
  const canonicalPath = id ? `/${route}/${id}` : '/download';
  const deepLinkUrl = `${CANONICAL_BASE.replace(/\/+$/, '')}${canonicalPath}`;

  const meta = useMemo(() => {
    if (route === 'invite') return { title: 'Circle Invite', description: 'Open this invite in Circles Health.' };
    if (route === 'circle') return { title: 'Circle Link', description: 'Open this circle in Circles Health.' };
    if (route === 'a') return { title: 'Affirmation Link', description: 'Open this affirmation in Circles Health.' };
    if (route === 'r') return { title: 'Resource Link', description: 'Open this resource in Circles Health.' };
    return { title: 'Open Circles Health', description: 'Install or open the app to continue.' };
  }, [route]);

  const openApp = () => {
    window.location.href = deepLinkUrl;
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/i.test(ua);
    window.setTimeout(() => {
      window.location.href = isIOS ? APP_STORE_URL : PLAY_STORE_URL;
    }, 1400);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F6F8FB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 620, background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 10px 30px rgba(2, 6, 23, 0.08)' }}>
        <h1 style={{ margin: 0, color: '#0f172a' }}>{meta.title}</h1>
        <p style={{ marginTop: 10, color: '#475569' }}>{meta.description}</p>
        <button onClick={openApp} style={{ marginTop: 14, width: '100%', padding: '13px 16px', borderRadius: 12, border: 0, background: '#0f766e', color: '#fff', fontWeight: 700 }}>
          Open in App
        </button>
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 10, textAlign: 'center', background: '#E2E8F0', color: '#0f172a', borderRadius: 12, padding: '13px 16px', textDecoration: 'none', fontWeight: 700 }}>
          Download on iOS
        </a>
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 10, textAlign: 'center', background: '#E2E8F0', color: '#0f172a', borderRadius: 12, padding: '13px 16px', textDecoration: 'none', fontWeight: 700 }}>
          Get it on Android
        </a>
      </div>
    </div>
  );
};

export default DeepLinkLanding;
