import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const DEFAULT_IOS_URL = 'https://apps.apple.com';
const DEFAULT_ANDROID_URL = 'https://play.google.com/store';

const getStoreUrl = (isIOS: boolean) => {
    if (isIOS) return (import.meta.env.VITE_APP_STORE_URL as string | undefined) || DEFAULT_IOS_URL;
    return (import.meta.env.VITE_PLAY_STORE_URL as string | undefined) || DEFAULT_ANDROID_URL;
};

const OpenInApp = () => {
    const navigate = useNavigate();
    const params = useParams<{ type: string; id: string }>();
    const type = String(params.type || '').trim().toLowerCase();
    const id = String(params.id || '').trim();

    const appLink = useMemo(() => {
        if (!type) return 'circlesapp://';
        if (id) return `circlesapp://${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
        return `circlesapp://${encodeURIComponent(type)}`;
    }, [id, type]);

    useEffect(() => {
        if (!type || !id) {
            navigate('/download', { replace: true });
            return;
        }

        const ua = navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/i.test(ua);
        const storeUrl = getStoreUrl(isIOS);

        const fallbackTimer = window.setTimeout(() => {
            window.location.replace(storeUrl);
        }, 1500);

        window.location.href = appLink;

        return () => window.clearTimeout(fallbackTimer);
    }, [appLink, id, navigate, type]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F8FAFC',
            padding: 24
        }}>
            <div style={{
                maxWidth: 520,
                width: '100%',
                textAlign: 'center',
                background: '#FFFFFF',
                borderRadius: 20,
                padding: 28,
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.10)'
            }}>
                <h1 style={{ margin: 0, color: '#0F172A' }}>Opening Circles Health App...</h1>
                <p style={{ color: '#475569', marginTop: 12 }}>
                    If nothing happens, you will be redirected to the app store automatically.
                </p>
                <a
                    href={appLink}
                    style={{
                        display: 'inline-block',
                        marginTop: 12,
                        color: '#009688',
                        fontWeight: 700,
                        textDecoration: 'none'
                    }}
                >
                    Tap here to open manually
                </a>
            </div>
        </div>
    );
};

export default OpenInApp;

