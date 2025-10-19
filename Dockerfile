FROM oven/bun:1-alpine AS base
ENV BUN_INSTALL_CACHE_DIR="/bun"
ENV CI=true
COPY . /app
WORKDIR /app

# FROM base AS build
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# RUN pnpm run build

# FROM base AS prod-deps
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base
# COPY --from=prod-deps /app/node_modules /app/node_modules
# COPY --from=build /app/packages/akismet-js/lib /app/packages/akismet-js/lib
RUN --mount=type=cache,id=bun,target=/bun bun install --prod --frozen-lockfile
EXPOSE 8360
CMD [ "bun", "index.js" ]