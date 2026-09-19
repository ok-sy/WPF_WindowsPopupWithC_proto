FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat bash 
RUN npm install -g pnpm@^9 turbo@2.4.4

# COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY .gitignore .gitignore 

RUN mkdir -p \
    sub/domain \
    sub/eslint-config \
    sub/typescript-config \
    sub/ui \
    sub/util \
    sub/validators \
    main


COPY sub/domain/package.json    ./sub/domain/
COPY sub/domain/tsconfig.json   ./sub/domain/
COPY sub/domain/src             ./sub/domain/src

COPY sub/eslint-config/base.js       ./sub/eslint-config/
COPY sub/eslint-config/next.js       ./sub/eslint-config/
COPY sub/eslint-config/package.json   ./sub/eslint-config/
COPY sub/eslint-config/react-internal.js   ./sub/eslint-config/

COPY sub/typescript-config/package.json         ./sub/typescript-config/
COPY sub/typescript-config/base.json            ./sub/typescript-config/
COPY sub/typescript-config/nextjs.json          ./sub/typescript-config/
COPY sub/typescript-config/react-library.json   ./sub/typescript-config/

COPY sub/ui/package.json         ./sub/ui/
COPY sub/ui/tsconfig.json        ./sub/ui/
COPY sub/ui/src                  ./sub/ui/src

COPY sub/util/package.json              ./sub/util/
COPY sub/util/tsconfig.json             ./sub/util/
COPY sub/util/src                       ./sub/util/src

COPY sub/validators/package.json        ./sub/validators/
COPY sub/validators/tsconfig.json       ./sub/validators/
COPY sub/validators/src                 ./sub/validators/src

COPY main/package.json                        ./main/
COPY main/tsconfig.json                       ./main/
COPY main/next.config.mjs                      ./main/
COPY main/pages                               ./main/pages
COPY main/public                              ./main/public
COPY main/src                                 ./main/src

RUN turbo prune --scope=@zerorule/web --docker

FROM node:20-alpine AS installer
WORKDIR /app

ARG ROUTER_BASE_URL=/
ARG BASE_URL=https://zerorule.labcl.net
# ARG API_BASE_URL=http://192.168.114.71:4018/zero-rule-server
ARG API_BASE_URL=https://zerorule.labcl.net/zero-rule-server

RUN apk add --no-cache libc6-compat bash 
RUN npm install -g pnpm@^9 turbo@2.4.4

COPY .gitignore .gitignore 
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --prefer-frozen-lockfile

COPY --from=builder /app/out/full/ .

RUN echo "API_BASE_URL=${API_BASE_URL}"        > ./main/.env.local && \
    echo "BASE_URL=${BASE_URL}"               >> ./main/.env.local && \
    echo "ROUTER_BASE_URL=${ROUTER_BASE_URL}" >> ./main/.env.local 

RUN pnpm turbo run build --filter=@zerorule/web 

FROM node:20-alpine as runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/main/next.config.mjs  .
COPY --from=installer /app/main/package.json    .

COPY --from=installer --chown=nextjs:nodejs /app/main/.next/standalone  /app/
COPY --from=installer --chown=nextjs:nodejs /app/main/.next/static      /app/main/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/main/public            /app/main/public

EXPOSE 3000
ENV PORT 3000
CMD node  /app/main/server.js
