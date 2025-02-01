import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"], // Main entry file
	format: ["esm", "cjs"], // Generate both ESM & CJS
	dts: true, // Generate TypeScript types
	sourcemap: true, // Enable source maps
	minify: true, // Minify for smaller bundle
	clean: true, // Clean 'dist/' before each build
});
