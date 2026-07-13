import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PMTiles (.pmtiles) 走 HTTP Range 請求，不需 Vite 特別處理；
// 放 public/data/ 即以靜態資產原樣提供（build 後進 dist/data/）。
export default defineConfig({
  plugins: [react()],
  server: { port: 5183, host: true },
});
