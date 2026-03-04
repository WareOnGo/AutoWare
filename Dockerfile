FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install dependencies ─────────────────────────────────────────────
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

RUN npm ci --workspace=autoware-backend --workspace=@repo/shared --include-workspace-root

# ── Copy source ──────────────────────────────────────────────────────
COPY packages/shared packages/shared
COPY apps/backend apps/backend

# ── Build shared package (TS → CJS) ─────────────────────────────────
RUN cd packages/shared && \
    npx tsc --module CommonJS --moduleResolution Node --rootDir src --outDir dist --declaration --esModuleInterop

# ── Generate Prisma client ───────────────────────────────────────────
RUN cd apps/backend && rm -f prisma.config.js prisma.config.ts && npx prisma generate --schema=prisma/schema.prisma

# ── Build backend ────────────────────────────────────────────────────
RUN npm run build --workspace=autoware-backend

# ── Point shared package to compiled CJS output (for runtime) ────────
RUN node -e "\
  const fs=require('fs');\
  const p=JSON.parse(fs.readFileSync('packages/shared/package.json','utf8'));\
  p.main='./dist/index.js';\
  p.types='./dist/index.d.ts';\
  fs.writeFileSync('packages/shared/package.json',JSON.stringify(p,null,2));"

# ── Cleanup build artifacts to keep image smaller ────────────────────
RUN rm -rf packages/shared/src apps/backend/tsconfig.json && \
    find apps/backend/src -mindepth 1 -maxdepth 1 ! -name generated -exec rm -rf {} +

# ── Ensure workspace symlink is correct ──────────────────────────────
RUN rm -rf node_modules/@repo/shared && ln -s ../../packages/shared node_modules/@repo/shared

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "apps/backend/dist/index.js"]
