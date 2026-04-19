export const getChallengeLevelLabel = (level = 'medium') => {
    const normalized = String(level || 'medium').toLowerCase();
    if (normalized === 'high') return 'Needs more support';
    if (normalized === 'low') return 'Looking steadier';
    return 'Worth noticing';
};

export const getChallengeSectionTitle = () => 'Daily Focus';
