import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [tailwindcss(), sveltekit()],
  server: {
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:8090",
    //     changeOrigin: true,
    //     secure: false, // Keep this as a safety measure for local dev
    //     // rewrite: (path) => path.replace(/^\/api/, ''),
    //   },
    // },
  },
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "client",
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium", headless: true }],
          },
          include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
          exclude: ["src/lib/server/**"],
        },
      },

      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});
