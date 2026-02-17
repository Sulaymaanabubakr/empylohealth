export const parseWellbeingScore = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(String(value).replace('%', '').trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const resolveWellbeingScore = (source = {}) => {
  const direct = parseWellbeingScore(source?.wellbeingScore);
  if (direct != null) return direct;
  return parseWellbeingScore(source?.stats?.overallScore);
};

export const getWellbeingRingColor = ({ wellbeingScore, wellbeingLabel, wellbeingStatus } = {}) => {
  const score = parseWellbeingScore(wellbeingScore);
  if (score != null) return score >= 70 ? '#2E7D32' : '#C62828';

  const label = String(wellbeingLabel || wellbeingStatus || '').toLowerCase();
  if (!label) return null;
  if (label.includes('struggl') || label.includes('attention')) return '#C62828';
  if (label.includes('good') || label.includes('well') || label.includes('thriv')) return '#2E7D32';
  return null;
};
