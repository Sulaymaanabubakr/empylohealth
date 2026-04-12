import { supabase } from '../supabase/supabaseClient';

const recommendationPalettes = [
    { background: '#F6F4FF', accent: '#705CF6', shape: '#E9E2FF' },
    { background: '#F4FBF8', accent: '#2FBF8D', shape: '#DDF7EC' },
    { background: '#FFF7F1', accent: '#F08A3E', shape: '#FFE7D4' },
    { background: '#F2FBFF', accent: '#2C98C9', shape: '#D8F1FB' },
];

const hashText = (input = '') => {
    let hash = 0;
    const text = String(input || '');
    for (let index = 0; index < text.length; index += 1) {
        hash = ((hash << 5) - hash) + text.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash);
};

const createRecommendationSvgDataUri = ({ id, title, category }) => {
    const titleLabel = String(title || 'Recommendation').slice(0, 28);
    const categoryLabel = String(category || 'Wellbeing').slice(0, 24);
    const seed = `${id || ''}|${titleLabel}|${categoryLabel}`;
    const palette = recommendationPalettes[hashText(seed) % recommendationPalettes.length];
    const initial = titleLabel.slice(0, 1).toUpperCase() || 'R';
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220">
  <rect width="400" height="220" rx="28" fill="${palette.background}"/>
  <circle cx="330" cy="40" r="48" fill="${palette.shape}" opacity="0.55"/>
  <circle cx="64" cy="184" r="68" fill="${palette.shape}" opacity="0.35"/>
  <rect x="26" y="26" width="72" height="72" rx="18" fill="${palette.accent}" opacity="0.93"/>
  <text x="62" y="74" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#FFFFFF">${initial}</text>
  <text x="26" y="136" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#0F172A">${titleLabel}</text>
  <text x="26" y="168" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="600" fill="${palette.accent}">${categoryLabel}</text>
</svg>`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const createExploreActivitySvgDataUri = ({ id, title, tag, category }) => {
    const safeTitle = String(title || 'Activity').trim() || 'Activity';
    const safeTag = String(tag || 'LEARN').trim().toUpperCase() || 'LEARN';
    const safeCategory = String(category || 'Self-development').trim() || 'Self-development';
    const seed = `${id || ''}|${safeTitle}|${safeTag}|${safeCategory}`;
    const palette = recommendationPalettes[hashText(`${seed}:palette`) % recommendationPalettes.length];
    const initial = safeTitle.slice(0, 1).toUpperCase() || 'A';
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">
  <rect width="360" height="220" rx="28" fill="${palette.background}"/>
  <circle cx="286" cy="56" r="44" fill="${palette.shape}" opacity="0.55"/>
  <circle cx="68" cy="184" r="60" fill="${palette.shape}" opacity="0.35"/>
  <rect x="28" y="28" width="76" height="76" rx="22" fill="${palette.accent}" opacity="0.94"/>
  <text x="66" y="78" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#FFFFFF">${initial}</text>
  <text x="28" y="138" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="${palette.accent}">${safeTag}</text>
  <text x="28" y="164" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#0F172A">${safeTitle.slice(0, 24)}</text>
  <text x="28" y="192" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="600" fill="#475569">${safeCategory.slice(0, 28)}</text>
</svg>`.trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const normalizeResource = (item, { variant = 'explore' } = {}) => {
    const title = String(item.title || item.name || item.label || '').trim() || 'Wellbeing Activity';
    const description = String(item.description || item.summary || '').trim() || 'A guided activity to support your wellbeing today.';
    const category = String(item.category || 'Self-development').trim() || 'Self-development';
    const tag = String(item.tag || item.type || 'LEARN').trim().toUpperCase() || 'LEARN';
    const time = String(item.time || '').trim() || '5 min';
    const color = String(item.color || '').trim() || '#F4F6F8';
    const image = String(item.image || '').trim() || (
        variant === 'recommendation'
            ? createRecommendationSvgDataUri({ id: item.id, title, category })
            : createExploreActivitySvgDataUri({ id: item.id, title, tag, category })
    );

    return {
        id: item.id,
        title,
        description,
        content: item.content || '',
        contentFormat: item.content_format || item.contentFormat || 'html',
        image,
        category,
        tag,
        time,
        color,
        status: item.status || 'active',
        tags: Array.isArray(item.tags) ? item.tags : [],
        themes: Array.isArray(item.themes) ? item.themes : (Array.isArray(item.tags) ? item.tags : []),
        access: item.access || {},
        createdAt: item.created_at || item.createdAt || null,
        publishedAt: item.published_at || item.publishedAt || null,
    };
};

const normalizeAffirmation = (item) => ({
    id: item.id,
    content: item.content || '',
    image: item.image || '',
    status: item.status || 'active',
    tags: Array.isArray(item.tags) ? item.tags : [],
    isActive: item.is_active !== false,
    scheduledDate: item.scheduled_date || null,
    createdAt: item.created_at || null,
});

const normalizeChallenge = (item) => ({
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    level: item.level || '',
    icon: item.icon || '',
    bg: item.bg || '',
    color: item.color || '',
    category: item.category || '',
    priority: item.priority || 0,
    status: item.status || 'active',
    tags: Array.isArray(item.tags) ? item.tags : [],
    isActive: item.is_active !== false,
    createdAt: item.created_at || null,
});

export const contentRepository = {
    normalizeExploreResource(item) {
        return normalizeResource(item, { variant: 'explore' });
    },

    normalizeRecommendationResource(item) {
        return normalizeResource(item, { variant: 'recommendation' });
    },

    async getExploreContent(limitCount = 30) {
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .neq('status', 'deleted')
            .order('created_at', { ascending: false })
            .limit(limitCount);

        if (error) throw error;
        return (data || []).map((item) => normalizeResource(item, { variant: 'explore' })).filter((item) => item.status !== 'rejected' && item.status !== 'suspended');
    },

    async getAffirmations(limitCount = 30) {
        const { data, error } = await supabase
            .from('affirmations')
            .select('*')
            .neq('status', 'deleted')
            .order('created_at', { ascending: false })
            .limit(limitCount);

        if (error) throw error;
        return (data || []).map(normalizeAffirmation).filter((item) => item.isActive !== false);
    },

    async getKeyChallenges(limitCount = 5) {
        const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .neq('status', 'deleted')
            .order('created_at', { ascending: false })
            .limit(limitCount);

        if (error) throw error;
        return (data || []).map(normalizeChallenge).filter((item) => item.isActive !== false);
    }
};
