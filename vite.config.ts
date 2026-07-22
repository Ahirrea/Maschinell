import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		// Reine Logik-Tests (units/validate) laufen ohne Browser-Umgebung.
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts']
	}
});
