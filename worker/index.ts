// mini-taipei-trees 的 Cloudflare Worker：只處理 /assets/* 與 /data/*（wrangler.jsonc 的 run_worker_first），
// 其他路徑由靜態資產直接回應，不經過這裡。
//
// 為什麼需要：
// 1. Workers 靜態資產不支援 HTTP Range（實測一律回 200 全檔），PMTiles 一定要 206，
//    所以在這裡從資產串流中切出要求的區段（對應 nginx 的 PMTiles location）。
//    資產 binding 的回應不帶 Content-Length，檔案大小改讀部署前產生的 /data/pmtiles-sizes.json
//   （scripts/cf-pmtiles-sizes.mjs，`pnpm cf:deploy` 會先跑）。
// 2. SPA 模式下找不到的檔案會回 index.html；/assets/、/data/ 底下不該有網頁，
//    改回 404，避免缺檔被當成 index.html 長效快取（對應 nginx 這兩個 location 沒有 try_files）。

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const PMTILES_CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};

// 只支援單一區段（PMTiles 用法）：bytes=a-b、bytes=a-、bytes=-n
function parseRange(header: string, size: number): { start: number; end: number } | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start: number;
  let end: number;
  if (m[1] === "") {
    const suffix = Number(m[2]);
    if (suffix === 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) return null;
  return { start, end };
}

// 從完整檔案串流切出 [start, end]，只傳 subarray（不複製位元組），讀到 end 就停止讀取
function sliceStream(body: ReadableStream<Uint8Array>, start: number, end: number): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  let pos = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        if (pos > end) {
          controller.close();
          await reader.cancel();
          return;
        }
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const chunkStart = pos;
        pos += value.byteLength;
        if (pos <= start) continue;
        const from = Math.max(0, start - chunkStart);
        const to = Math.min(value.byteLength, end - chunkStart + 1);
        controller.enqueue(value.subarray(from, to));
        return;
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

let sizesCache: Promise<Record<string, number>> | null = null;
function pmtilesSizes(request: Request, env: Env): Promise<Record<string, number>> {
  if (!sizesCache) {
    const p = env.ASSETS.fetch(new Request(new URL("/data/pmtiles-sizes.json", request.url)))
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, number>>) : {}))
      .catch(() => ({}));
    sizesCache = p;
    // 讀失敗（空物件）時不快取，下次再試
    p.then((v) => {
      if (Object.keys(v).length === 0) sizesCache = null;
    });
  }
  return sizesCache;
}

async function servePmtiles(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: PMTILES_CORS });

  const rangeHeader = request.headers.get("Range");
  // 不帶 Range 交給資產處理（會套 _headers 的快取、CORS 與 Content-Type）
  const assetRequest = new Request(request.url, { method: request.method === "HEAD" ? "HEAD" : "GET" });
  const res = await env.ASSETS.fetch(assetRequest);
  if (!res.ok || !rangeHeader || res.status === 206) return res;

  const size = (await pmtilesSizes(request, env))[new URL(request.url).pathname] ?? 0;
  const headers = new Headers(res.headers);
  headers.set("Accept-Ranges", "bytes");
  // 大小未知時退回 200 全檔（PMTiles 用戶端會報錯，代表部署前漏跑 cf-pmtiles-sizes）
  if (!Number.isFinite(size) || size <= 0) return new Response(res.body, { status: res.status, headers });

  const range = parseRange(rangeHeader, size);
  if (!range) {
    res.body?.cancel();
    headers.set("Content-Range", `bytes */${size}`);
    headers.delete("Content-Length");
    return new Response(null, { status: 416, headers });
  }
  const length = range.end - range.start + 1;
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("Content-Length", String(length));
  if (request.method === "HEAD" || !res.body) {
    res.body?.cancel();
    return new Response(null, { status: 206, headers });
  }
  return new Response(sliceStream(res.body, range.start, range.end), { status: 206, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith(".pmtiles")) return servePmtiles(request, env);

    const res = await env.ASSETS.fetch(request);
    // /assets/、/data/ 底下沒有網頁：拿到 HTML 代表是 SPA fallback（檔案不存在）
    if ((res.headers.get("Content-Type") ?? "").startsWith("text/html")) {
      res.body?.cancel();
      return new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
    return res;
  },
};
