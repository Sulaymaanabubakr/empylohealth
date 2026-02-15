const marks = new Map();

const now = () => Date.now();

export const perfLogger = {
    mark(name) {
        marks.set(name, now());
    },

    elapsedSince(name) {
        const start = marks.get(name);
        if (!start) return null;
        return now() - start;
    },

    log(label, valueMs) {
        if (typeof valueMs !== 'number') return;
        console.log(`[PERF] ${label}: ${valueMs}ms`);
    }
};
