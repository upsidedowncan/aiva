import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const DATA_DIR = 'data';
const ADMIN_FILE = join(DATA_DIR, 'admin.json');

const SESSION_TTL_S = 60 * 60 * 24 * 7;
const ALG = 'HS256';

let passwordHash: string | null = null;
let jwtSecret: Uint8Array | null = null;

function ensureDataDir() {
	if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

async function init() {
	if (passwordHash && jwtSecret) return;
	ensureDataDir();

	if (existsSync(ADMIN_FILE)) {
		const data = JSON.parse(readFileSync(ADMIN_FILE, 'utf-8')) as {
			passwordHash: string;
			jwtSecret?: string;
		};
		passwordHash = data.passwordHash;
		if (data.jwtSecret) {
			jwtSecret = new TextEncoder().encode(data.jwtSecret);
		}
	}

	if (!passwordHash) {
		const plain = process.env.ADMIN_PASSWORD || 'aiva123';
		passwordHash = await bcrypt.hash(plain, 10);
	}

	if (!jwtSecret) {
		const envSecret = process.env.JWT_SECRET;
		const secretStr = envSecret || randomBytes(48).toString('base64url');
		jwtSecret = new TextEncoder().encode(secretStr);
	}

	const payload: { passwordHash: string; jwtSecret: string } = {
		passwordHash,
		jwtSecret: new TextDecoder().decode(jwtSecret)
	};
	writeFileSync(ADMIN_FILE, JSON.stringify(payload, null, 2));

	if (!process.env.JWT_SECRET) {
		console.log(`\nAdmin ready. JWT secret generated and stored in ${ADMIN_FILE}.`);
		console.log('Set JWT_SECRET env var to use a stable secret across restarts.\n');
	}
}

export async function ensureInitialized() {
	await init();
}

export async function verifyPassword(plain: string): Promise<boolean> {
	await init();
	if (!passwordHash) return false;
	return bcrypt.compare(plain, passwordHash);
}

export async function createSessionJwt(): Promise<string> {
	await init();
	if (!jwtSecret) throw new Error('JWT secret not initialized');
	return new SignJWT({ sub: 'admin' })
		.setProtectedHeader({ alg: ALG })
		.setIssuedAt()
		.setExpirationTime(`${SESSION_TTL_S}s`)
		.sign(jwtSecret);
}

export async function verifySessionJwt(token: string | undefined): Promise<boolean> {
	await init();
	if (!token || !jwtSecret) return false;
	try {
		await jwtVerify(token, jwtSecret, { algorithms: [ALG] });
		return true;
	} catch {
		return false;
	}
}
