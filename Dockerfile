# syntax=docker/dockerfile:1
#
# mini-taipei-trees — Zeabur 部署用
# Vite + React SPA，public/data/ 含 PMTiles 靜態圖磚

# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# 先裝依賴（layer cache）
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# VITE_ build-time 變數（Zeabur build-arg 注入）
ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

COPY . .
RUN pnpm build

# ---------- Stage 2: serve ----------
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
