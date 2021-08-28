import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import solidSvg from "vite-plugin-solid-svg";

declare var process : {
  env: {
    VITE_BASE: string | undefined
  }
}

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [solidPlugin(), solidSvg()],
  build: {
    target: "esnext",
    polyfillDynamicImport: false,
  },
});
