import { ensureInitialized } from '../src/lib/server/auth';

await ensureInitialized();
console.log('Admin ready. Password is "aiva123" by default (override via ADMIN_PASSWORD env).');
