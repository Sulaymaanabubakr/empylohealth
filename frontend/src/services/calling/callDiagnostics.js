const enabled = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

const sessions = new Map();

const nowIso = () => new Date().toISOString();

const getSession = (callId) => {
  if (!enabled) return null;
  if (!callId) return null;
  if (!sessions.has(callId)) {
    sessions.set(callId, []);
  }
  return sessions.get(callId);
};

export const callDiagnostics = {
  enabled: () => enabled,

  log: (callId, event, details = null) => {
    if (!enabled) return;
    const session = getSession(callId);
    if (!session) return;
    const entry = { ts: nowIso(), event, details };
    session.push(entry);
    // Keep latest N entries to avoid runaway memory.
    if (session.length > 200) session.splice(0, session.length - 200);
    try {
      // Structured, grep-friendly log line.
      console.log('[CALL_DIAG]', callId, event, details ? JSON.stringify(details) : '');
    } catch {
      console.log('[CALL_DIAG]', callId, event);
    }
  },

  dump: (callId) => {
    const session = getSession(callId);
    return session ? [...session] : [];
  },

  clear: (callId) => {
    if (!enabled || !callId) return;
    sessions.delete(callId);
  }
};

