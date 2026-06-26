import { defineConfig } from "vite";
import { resolvePublicBasePath } from "./scripts/site-paths.mjs";

export default defineConfig({
  base: resolvePublicBasePath(),
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
    allowedHosts: true,
  },
});
