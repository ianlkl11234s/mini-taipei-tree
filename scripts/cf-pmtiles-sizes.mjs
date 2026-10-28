// 部署到 Cloudflare 前執行：把 dist/ 裡每個 .pmtiles 的檔案大小寫進 dist/data/pmtiles-sizes.json。
// Worker 用它回 Range 206（Workers 靜態資產本身不支援 Range，資產 binding 的回應也不帶 Content-Length）。
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const dist = "dist";
const sizes = {};
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name.endsWith(".pmtiles")) sizes["/" + relative(dist, p).split(sep).join("/")] = st.size;
  }
};
walk(dist);
if (Object.keys(sizes).length === 0) {
  console.error("dist/ 裡找不到 .pmtiles，先跑 build");
  process.exit(1);
}
writeFileSync(join(dist, "data", "pmtiles-sizes.json"), JSON.stringify(sizes, null, 2) + "\n");
console.log(`pmtiles-sizes.json：${Object.keys(sizes).length} 個檔`);
