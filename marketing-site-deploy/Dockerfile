# ============================================================
# Marketing Site - Next.js Standalone Docker 镜像
# 多阶段构建：build 阶段编译，run 阶段只保留运行时文件
# ============================================================

FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖文件并安装
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN corepack enable 2>/dev/null; \
    if [ -f pnpm-lock.yaml ]; then \
      corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    else \
      npm ci; \
    fi

# 复制源码并构建
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 运行阶段 ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制 standalone 输出
COPY --from=builder /app/.next/standalone ./
# 复制静态资源（.next/static 是客户端 JS/CSS）
COPY --from=builder /app/.next/static ./.next/static
# 复制 public 目录（如果存在）
COPY --from=builder /app/public ./public

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
