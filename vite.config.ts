import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: true,
		port: 5173,
		allowedHosts: ['a0757c6abd54e91f-64-188-81-95.serveousercontent.com'],
		strictPort: false
	}
});
