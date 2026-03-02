export const parseWellbeingScore = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(String(value).replace('%', '').trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const labelFromWellbeingScore = (score) => {
  const n = parseWellbeingScore(score);
  if (n == null) return 'No data';
  if (n >= 80) return 'Thriving';
  if (n >= 60) return 'Steady';
  if (n >= 40) return 'Managing';
  if (n >= 20) return 'Low';
  return 'Need Support';
};

export const normalizeWellbeingLabel = (label = '', score = null) => {
  const raw = String(label || '').trim();
  const normalized = raw.toLowerCase();
  if (!normalized) return labelFromWellbeingScore(score);
  if (normalized.includes('thriv')) return 'Thriving';
  if (normalized.includes('steady') || normalized.includes('doing well') || normalized.includes('stable')) return 'Steady';
  if (normalized.includes('manag') || normalized.includes('moderate') || normalized.includes('okay') || normalized.includes('ok')) return 'Managing';
  if (normalized.includes('low') || normalized.includes('struggl')) return 'Low';
  if (normalized.includes('support') || normalized.includes('attention') || normalized.includes('critical')) return 'Need Support';
  return labelFromWellbeingScore(score);
};

export const resolveWellbeingScore = (source = {}) => {
  const direct = parseWellbeingScore(source?.wellbeingScore);
  if (direct != null) return direct;
  return parseWellbeingScore(source?.stats?.overallScore);
};

export const getWellbeingRingColor = ({ wellbeingScore, wellbeingLabel, wellbeingStatus } = {}) => {
  const score = parseWellbeingScore(wellbeingScore);
  if (score != null) {
    if (score <= 34) return '#C62828'; // Red: 0-34
    if (score <= 64) return '#F59E0B'; // Amber: 35-64
    return '#2E7D32'; // Green: 65-100
  }

  const canonical = normalizeWellbeingLabel(wellbeingLabel || wellbeingStatus, score);
  const label = String(canonical || wellbeingLabel || wellbeingStatus || '').toLowerCase();
  if (!label) return null;

  // Red band
  if (
    label.includes('need support') ||
    label.includes('support') ||
    label.includes('low') ||
    label.includes('struggl') ||
    label.includes('critical') ||
    label.includes('attention')
  ) return '#C62828';

  // Amber band
  if (
    label.includes('manag') ||
    label.includes('steady') ||
    label.includes('moderate') ||
    label.includes('fair') ||
    label.includes('okay') ||
    label.includes('neutral') ||
    label.includes('under pressure')
  ) return '#F59E0B';

  // Green band
  if (
    label.includes('thriv') ||
    label.includes('improv') ||
    label.includes('good') ||
    label.includes('well') ||
    label.includes('stable')
  ) return '#2E7D32';

  return null;
};
