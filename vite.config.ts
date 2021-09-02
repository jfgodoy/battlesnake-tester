import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import solidSvg from "vite-plugin-solid-svg";
import Icons from "unplugin-icons/vite";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";


declare const process : {
  env: {
    VITE_BASE: string | undefined
  }
};

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [
    solidPlugin(),
    solidSvg(),
    AutoImport({
      resolvers: IconsResolver({componentPrefix: "Icon"})
    }),
    Icons({ compiler: "solid" })
  ],
  build: {
    target: "esnext",
    polyfillDynamicImport: false,
  },
});
