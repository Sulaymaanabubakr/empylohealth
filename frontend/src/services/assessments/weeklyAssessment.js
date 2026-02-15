const DEFAULT_WEEKLY_TIMEZONE = 'Africa/Lagos';

const pad2 = (n) => String(n).padStart(2, '0');

const getTzDateParts = (date, timeZone = DEFAULT_WEEKLY_TIMEZONE) => {
  // Use Intl to get the calendar date in a fixed timezone so "weekly" resets are consistent.
  // We then treat that YYYY-MM-DD as the day for ISO-week computations.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = fmt.formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return { year, month, day };
};

const getIsoWeekKeyFromUtcDate = (dateUtc) => {
  // ISO week: weeks start Monday. Week 1 is the week with Jan 4th (or the first Thursday).
  const d = new Date(Date.UTC(dateUtc.getUTCFullYear(), dateUtc.getUTCMonth(), dateUtc.getUTCDate()));
  const day = d.getUTCDay() || 7; // 1..7 (Mon..Sun)
  d.setUTCDate(d.getUTCDate() + 4 - day); // shift to Thursday
  const weekYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${weekYear}-W${pad2(weekNo)}`;
};

export const weeklyAssessment = {
  getCurrentWeekKey: (now = new Date(), timeZone = DEFAULT_WEEKLY_TIMEZONE) => {
    const { year, month, day } = getTzDateParts(now, timeZone);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return getIsoWeekKeyFromUtcDate(utcDate);
  },

  // Migration helper for legacy storage value.
  getWeekKeyForIsoString: (isoString, timeZone = DEFAULT_WEEKLY_TIMEZONE) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return null;
    return weeklyAssessment.getCurrentWeekKey(d, timeZone);
  }
};

