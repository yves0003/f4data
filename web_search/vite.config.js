import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  assetsInclude: ["**/*.svg"],
  plugins: [react()],
  root: "./src",
  build: {
    outDir: "../build",
  },
});
