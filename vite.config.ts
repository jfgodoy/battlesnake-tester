import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import solidSvg from "vite-plugin-solid-svg";
import Icons from "unplugin-icons/vite";

declare const process : {
  env: {
    VITE_BASE: string | undefined
  }
};

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [solidPlugin(), solidSvg(), Icons({ compiler: "solid" })],
  build: {
    target: "esnext",
    polyfillDynamicImport: false,
  },
});
