// Shared abuse guards for the OpenAI proxy endpoints.
// ponytail: header-based origin check — blocks casual curl/open-relay abuse,
// not a determined attacker spoofing Origin. Upgrade path: signed session
// token or Vercel WAF rate rules if abuse shows up in function logs.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export function isAllowedOrigin(req: any): boolean {
    const origin = req.headers?.origin;
    if (!origin || typeof origin !== 'string') return false;

    let originHost: string;
    try {
        originHost = new URL(origin).hostname;
    } catch {
        return false;
    }

    if (LOCAL_HOSTS.has(originHost)) return true;

    const requestHost = String(req.headers?.host || '').split(':')[0];
    if (requestHost && originHost === requestHost) return true;

    const extra = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    return extra.includes(originHost);
}

export function rejectBadOrigin(req: any, res: any): boolean {
    if (isAllowedOrigin(req)) return false;
    res.status(403).json({ error: { message: 'Forbidden origin.' } });
    return true;
}

export function clampNumber(value: unknown, fallback: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(parsed, max);
}

export function exceedsLength(value: unknown, max: number): boolean {
    if (typeof value === 'string') return value.length > max;
    if (value == null) return false;
    try {
        return JSON.stringify(value).length > max;
    } catch {
        return true;
    }
}
