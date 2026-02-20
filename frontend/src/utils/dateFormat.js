const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return Number.isNaN(d?.getTime?.()) ? null : d;
  }
  if (typeof value === 'object' && (value?.seconds || value?._seconds)) {
    const seconds = Number(value?.seconds || value?._seconds || 0);
    const nanos = Number(value?.nanoseconds || value?._nanoseconds || 0);
    const d = new Date((seconds * 1000) + Math.floor(nanos / 1e6));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDateUK = (value, options = { day: '2-digit', month: '2-digit', year: 'numeric' }) => {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString('en-GB', options);
};

export const formatDateTimeUK = (
  value,
  options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
) => {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleString('en-GB', options);
};

export const formatTimeUK = (value, options = { hour: '2-digit', minute: '2-digit' }) => {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleTimeString('en-GB', options);
};

export const toDateObject = toDate;

