import { randomUUID } from 'node:crypto';

type Session = {
	id: string;
	firstSeen: number;
	lastSeen: number;
};

const LIVE_WINDOW_MS = 60 * 1000;
const TODAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const sessions = new Map<string, Session>();
let lastSweep = Date.now();

function sweep() {
	const now = Date.now();
	if (now - lastSweep < SWEEP_INTERVAL_MS) return;
	lastSweep = now;
	for (const [id, s] of sessions) {
		if (now - s.lastSeen > TODAY_WINDOW_MS) sessions.delete(id);
	}
}

export function recordPresence(id: string): void {
	const now = Date.now();
	const existing = sessions.get(id);
	if (existing) {
		existing.lastSeen = now;
	} else {
		sessions.set(id, { id, firstSeen: now, lastSeen: now });
	}
	sweep();
}

export function getMetrics() {
	const now = Date.now();
	sweep();
	let live = 0;
	let today = 0;
	for (const s of sessions.values()) {
		if (now - s.lastSeen <= LIVE_WINDOW_MS) live++;
		if (now - s.firstSeen <= TODAY_WINDOW_MS) today++;
	}
	return {
		live,
		today,
		orders: 0,
		updatedAt: now
	};
}
