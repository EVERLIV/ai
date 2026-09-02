import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const STORAGE_API = "https://api.arendacity.com";

/**
 * Надёжный прокси Storage для localhost (обход CORS).
 * Стандартный Vite http-proxy рвал PUT с телом (ERR_CONNECTION_RESET).
 */
function storageDevProxy(): Plugin {
  return {
    name: "storage-dev-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/storage/")) {
          next();
          return;
        }
        try {
          await forwardStorage(req, res);
        } catch (err) {
          console.error("[storage-dev-proxy]", err);
          if (!res.headersSent) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Storage proxy failed" }));
          }
        }
      });
    },
  };
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function forwardStorage(req: IncomingMessage, res: ServerResponse) {
  const targetUrl = `${STORAGE_API}${req.url}`;
  const method = (req.method || "GET").toUpperCase();
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    const lower = key.toLowerCase();
    if (
      lower === "host" ||
      lower === "connection" ||
      lower === "origin" ||
      lower === "referer" ||
      lower === "content-length"
    ) {
      continue;
    }
    headers[key] = Array.isArray(value) ? value.join(",") : value;
  }

  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await readBody(req) : undefined;
  if (body && body.length > 0) {
    headers["content-length"] = String(body.length);
  }

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: body && body.length > 0 ? body : undefined,
    // @ts-expect-error Node fetch duplex
    duplex: body && body.length > 0 ? "half" : undefined,
  });

  res.statusCode = upstream.status;
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === "transfer-encoding" ||
      lower === "content-encoding" ||
      lower === "content-length"
    ) {
      return;
    }
    res.setHeader(key, value);
  });

  const out = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Length", String(out.length));
  res.end(out);
}

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    proxy: {
      "/api/chat": {
        target: process.env.CHAT_BACKEND_URL || "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    storageDevProxy(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icons/*.png"],
      manifest: {
        name: "ДАДАТУТ — Коммерческая недвижимость",
        short_name: "ДАДАТУТ",
        description: "Аренда офисов, складов и торговых площадей в Иркутске",
        theme_color: "#8B0015",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        lang: "ru",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^https:\/\/api\.arendacity\.com\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
}));
