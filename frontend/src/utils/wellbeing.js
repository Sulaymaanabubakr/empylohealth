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
  if (score != null) {
    if (score <= 34) return '#C62828'; // Red: 0-34
    if (score <= 64) return '#F59E0B'; // Amber: 35-64
    return '#2E7D32'; // Green: 65-100
  }

  const label = String(wellbeingLabel || wellbeingStatus || '').toLowerCase();
  if (!label) return null;
  if (label.includes('struggl') || label.includes('attention')) return '#C62828';
  if (label.includes('okay') || label.includes('neutral') || label.includes('fair')) return '#F59E0B';
  if (label.includes('good') || label.includes('well') || label.includes('thriv')) return '#2E7D32';
  return null;
};
